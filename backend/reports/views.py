from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Avg, Count, Q
from collections import defaultdict

from assessment.models import Assessment, Grade
from so.models import StudentOutcome
from courses.models import Course
from classess.models import Section


class ReportViewSet(ViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    def _build_so_summary_tables(self, assessments):
        so_tables = []

        # Load the related rows once so the summary can be assembled in Python.
        assessment_rows = list(
            assessments.select_related(
                "section__course",
                "student_outcome",
            ).prefetch_related(
                "student_outcome__performance_indicators__criteria",
                "section__enrollments__student",
                "grades__student",
                "grades__criterion__performance_indicator",
            )
        )

        grouped_by_so = defaultdict(list)
        for assessment in assessment_rows:
            grouped_by_so[assessment.student_outcome_id].append(assessment)

        for _, so_assessments in sorted(
            grouped_by_so.items(),
            key=lambda item: item[1][0].student_outcome.number if item[1] else 0,
        ):
            first_assessment = so_assessments[0]
            student_outcome = first_assessment.student_outcome

            course_groups = defaultdict(list)
            for assessment in so_assessments:
                course_groups[assessment.section.course_id].append(assessment)

            course_summaries = []
            virtual_class_size_total = 0
            weighted_satisfactory_total = 0
            actual_student_total = 0
            source_courses = []
            school_years = sorted({assessment.school_year for assessment in so_assessments if assessment.school_year})
            programs = set()

            for _, course_assessments in sorted(
                course_groups.items(),
                key=lambda item: item[1][0].section.course.code if item[1] else "",
            ):
                sample_assessment = course_assessments[0]
                course = sample_assessment.section.course
                source_courses.append(course.name)

                enrolled_students = {}
                for assessment in course_assessments:
                    for enrollment in assessment.section.enrollments.all():
                        enrolled_students[enrollment.student_id] = enrollment.student

                if enrolled_students:
                    programs.update(
                        student.program for student in enrolled_students.values() if student.program
                    )

                # Merge grades across sections for the same course + SO.
                grades_by_student_indicator = defaultdict(list)
                answered_students = set()
                for assessment in course_assessments:
                    for grade in assessment.grades.all():
                        indicator = grade.criterion.performance_indicator
                        grades_by_student_indicator[(grade.student_id, indicator.id)].append(grade.score)
                        answered_students.add(grade.student_id)

                indicators = list(student_outcome.performance_indicators.all())
                total_criteria = sum(len(pi.criteria.all()) for pi in indicators) or len(indicators) or 1
                indicator_rows = []

                actual_class_size = len(enrolled_students)
                answered_any_count = len(answered_students)
                course_virtual_class_size = 0
                course_weighted_satisfactory = 0
                population_student_ids = list(enrolled_students.keys()) if enrolled_students else list(answered_students)

                for indicator in indicators:
                    criteria_count = len(indicator.criteria.all()) or 1
                    distribution = criteria_count / total_criteria

                    indicator_student_scores = []
                    for student_id in population_student_ids:
                        scores = grades_by_student_indicator.get((student_id, indicator.id), [])
                        if scores:
                            indicator_student_scores.append(sum(scores) / len(scores))

                    answered_count = len(indicator_student_scores)
                    satisfactory_count = sum(
                        1 for avg_score in indicator_student_scores if ((avg_score / 6) * 100) >= 80
                    )
                    weighted_value = satisfactory_count * distribution

                    indicator_label = f"P{indicator.number}"
                    indicator_rows.append({
                        "indicator_id": indicator.id,
                        "indicator_label": indicator_label,
                        "distribution": round(distribution, 4),
                        "answered_count": answered_count,
                        "satisfactory_count": satisfactory_count,
                        "weighted_value": round(weighted_value, 4),
                    })
                    course_weighted_satisfactory += weighted_value

                if actual_class_size == 0:
                    actual_class_size = answered_any_count

                cli = round(1 / max(len(course_groups), 1), 4)
                virtual_class_size = actual_class_size * cli
                virtual_class_size_total += virtual_class_size
                weighted_satisfactory_total += course_weighted_satisfactory
                actual_student_total += actual_class_size
                course_virtual_class_size += virtual_class_size

                course_summaries.append({
                    "course_id": course.id,
                    "course_code": course.code,
                    "course_name": course.name,
                    "actual_class_size": actual_class_size,
                    "cli": cli,
                    "answered_count": answered_any_count,
                    "virtual_class_size": round(course_virtual_class_size, 4),
                    "indicators": indicator_rows,
                    "weighted_total": round(course_weighted_satisfactory, 4),
                })

            attainment_percent = (
                (weighted_satisfactory_total / virtual_class_size_total) * 100
                if virtual_class_size_total > 0 else 0
            )

            sorted_courses = list(dict.fromkeys(source_courses))
            target_level = 80
            comparison = "higher than" if attainment_percent >= target_level else "lower than"
            source_label = ", ".join(sorted_courses) if sorted_courses else "No courses"
            school_year_label = ", ".join(school_years) if school_years else "N/A"
            program_label = ", ".join(sorted(programs)) if programs else "Computer Engineering"

            so_tables.append({
                "so_id": student_outcome.id,
                "so_number": student_outcome.number,
                "so_title": student_outcome.title,
                "so_description": student_outcome.description,
                "institution": "TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES",
                "program": program_label,
                "source_assessment": source_label,
                "time_of_data_collection": school_year_label,
                "courses": course_summaries,
                "totals": {
                    "actual_student_total": actual_student_total,
                    "virtual_class_size_total": round(virtual_class_size_total, 4),
                    "weighted_satisfactory_total": round(weighted_satisfactory_total, 4),
                    "attainment_percent": round(attainment_percent, 2),
                    "target_level": target_level,
                    "conclusion": (
                        f"{round(attainment_percent, 2)}% of the class got satisfactory rating or higher. "
                        f"Thus, the level of attainment is {comparison} the target level of {target_level}%."
                    ),
                },
            })

        return so_tables

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        school_year = request.query_params.get("school_year")
        section_id = request.query_params.get("section")
        course_id = request.query_params.get("course")
        so_id = request.query_params.get("so")

        assessments = Assessment.objects.select_related(
            "section__course",
            "student_outcome"
        )

        if school_year:
            assessments = assessments.filter(school_year=school_year)
        if section_id:
            assessments = assessments.filter(section_id=section_id)
        if course_id:
            assessments = assessments.filter(section__course_id=course_id)
        if so_id:
            assessments = assessments.filter(student_outcome_id=so_id)

        grades = Grade.objects.filter(assessment__in=assessments)

        # ── METRICS ──
        total_sos = assessments.values("student_outcome").distinct().count()
        total_courses = assessments.values("section__course").distinct().count()
        total_sections = assessments.values("section").distinct().count()

        avg_score_raw = grades.aggregate(avg=Avg("score"))["avg"] or 0
        avg_performance = (avg_score_raw / 6) * 100 if avg_score_raw else 0

        # Total students across all filtered assessments
        total_students = grades.values("student").distinct().count()

        # Completion: how many assessments have at least 1 grade vs total
        total_assessments = assessments.count()
        completed_assessments = assessments.filter(grades__isnull=False).distinct().count()
        completion_rate = (completed_assessments / total_assessments * 100) if total_assessments > 0 else 0

        # ── SO PERFORMANCE ──
        so_perf_raw = (
            grades
            .values(
                "assessment__student_outcome__id",
                "assessment__student_outcome__number",
                "assessment__student_outcome__title",
            )
            .annotate(avg_score=Avg("score"))
            .order_by("assessment__student_outcome__number")
        )

        so_performance = []
        for row in so_perf_raw:
            so_num = row["assessment__student_outcome__number"]
            avg_raw = row["avg_score"] or 0
            avg_pct = round((avg_raw / 6) * 100, 1)

            # Pass rate for this SO: % of students with avg >= 5 (satisfactory)
            student_avgs = (
                grades
                .filter(assessment__student_outcome__id=row["assessment__student_outcome__id"])
                .values("student")
                .annotate(student_avg=Avg("score"))
            )
            total_s = student_avgs.count()
            passed_s = student_avgs.filter(student_avg__gte=5).count()
            pass_rate = round((passed_s / total_s) * 100, 1) if total_s > 0 else 0

            so_performance.append({
                "id": row["assessment__student_outcome__id"],
                "number": so_num,
                "name": row["assessment__student_outcome__title"],
                "avg": avg_pct,
                "pass_rate": pass_rate,
                "met": avg_pct >= 80,
            })

        # ── COURSE SUMMARY ──
        course_summary_raw = (
            grades
            .values(
                "assessment__section__course__id",
                "assessment__section__course__code",
                "assessment__section__course__name",
            )
            .annotate(
                avg_score=Avg("score"),
                total_students=Count("student", distinct=True),
            )
            .order_by("assessment__section__course__code")
        )

        course_summary = []
        for row in course_summary_raw:
            c_id = row["assessment__section__course__id"]
            avg_raw = row["avg_score"] or 0
            avg_pct = round((avg_raw / 6) * 100, 1)

            # Linked SOs
            linked_sos = list(
                assessments
                .filter(section__course_id=c_id)
                .values_list("student_outcome__number", flat=True)
                .distinct()
                .order_by("student_outcome__number")
            )

            # Pass rate
            student_avgs = (
                grades
                .filter(assessment__section__course_id=c_id)
                .values("student")
                .annotate(student_avg=Avg("score"))
            )
            total_s = student_avgs.count()
            passed_s = student_avgs.filter(student_avg__gte=5).count()
            pass_rate = round((passed_s / total_s) * 100, 1) if total_s > 0 else 0

            # Faculty names
            faculty_names = list(
                Section.objects
                .filter(course_id=c_id, assessments__in=assessments)
                .exclude(assigned_faculty__isnull=True)
                .values_list("assigned_faculty__name", flat=True)
                .distinct()
            )

            course_summary.append({
                "code": row["assessment__section__course__code"],
                "name": row["assessment__section__course__name"],
                "instructor": ", ".join(faculty_names) if faculty_names else "—",
                "sos": linked_sos,
                "students": row["total_students"],
                "avg": avg_pct,
                "pass_rate": pass_rate,
            })

        # ── FILTER OPTIONS ──
        all_school_years = sorted(
            Section.objects.exclude(school_year="")
            .values_list("school_year", flat=True)
            .distinct()
        )

        all_courses = list(
            Course.objects.values("id", "code", "name").order_by("code")
        )

        all_sections = list(
            Section.objects
            .select_related("course")
            .values("id", "name", "course__code", "school_year")
            .order_by("name")
        )

        all_sos = list(
            StudentOutcome.objects.values("id", "number", "title").order_by("number")
        )

        so_summary_tables = self._build_so_summary_tables(assessments)

        return Response({
            "metrics": {
                "total_student_outcomes": total_sos,
                "total_courses": total_courses,
                "total_sections": total_sections,
                "total_students": total_students,
                "avg_performance": round(avg_performance, 1),
                "completion_rate": round(completion_rate, 1),
                "total_assessments": total_assessments,
                "completed_assessments": completed_assessments,
            },
            "so_performance": so_performance,
            "course_summary": course_summary,
            "so_summary_tables": so_summary_tables,
            "filter_options": {
                "school_years": all_school_years,
                "courses": all_courses,
                "sections": all_sections,
                "student_outcomes": all_sos,
            },
        })

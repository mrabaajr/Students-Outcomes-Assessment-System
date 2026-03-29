from rest_framework import status
from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Avg, Count
from django.db.utils import OperationalError, ProgrammingError
from collections import defaultdict

from assessment.models import Assessment, Grade
from so.models import StudentOutcome
from courses.models import Course, CourseSOMapping
from classess.models import Section
from .models import ReportTemplate
from .serializers import ReportTemplateSerializer


DEFAULT_FORMULA = "(got80OrHigher / studentsAnswered) * distribution"
DEFAULT_VARIABLES = [
    {"key": "distribution", "label": "Distribution (i)"},
    {"key": "studentsAnswered", "label": "Students Answered"},
    {"key": "got80OrHigher", "label": "Got 80% or Higher"},
]


def faculty_display_name(faculty):
    if not faculty:
        return ""
    return " ".join(part for part in [faculty.first_name, faculty.last_name] if part).strip() or faculty.email


class ReportViewSet(ViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    def _report_scope_filters(self, school_year="", course_id=None, section_id=None):
        return {
            "school_year": school_year or "",
            "course_id": course_id or None,
            "section_id": section_id or None,
        }

    def _build_default_conclusion(self, attainment_percent, target_level):
        comparison = "higher than" if attainment_percent >= target_level else "lower than"
        return (
            f"{round(attainment_percent, 2)}% of the class got satisfactory rating or higher. "
            f"Thus, the level of attainment is {comparison} the target level of {target_level}%."
        )

    def _merge_saved_table(self, base_table, saved_table):
        if not saved_table:
            return dict(base_table)

        merged = dict(base_table)
        merged["program"] = saved_table.get("program", merged.get("program"))
        merged["source_assessment"] = saved_table.get(
            "source_assessment", merged.get("source_assessment")
        )
        merged["time_of_data_collection"] = saved_table.get(
            "time_of_data_collection", merged.get("time_of_data_collection")
        )

        merged_totals = dict(merged.get("totals", {}))
        saved_totals = saved_table.get("totals", {})
        for field in ("target_level", "target_statement", "conclusion"):
            if field in saved_totals:
                merged_totals[field] = saved_totals[field]
        merged["totals"] = merged_totals

        saved_courses = {
            course.get("course_id"): course for course in saved_table.get("courses", [])
        }
        merged_courses = []
        for course in merged.get("courses", []):
            saved_course = saved_courses.get(course.get("course_id"))
            if not saved_course:
                merged_courses.append(course)
                continue

            merged_course = dict(course)
            for field in (
                "course_name",
                "actual_class_size",
                "cli",
                "answered_count",
                "virtual_class_size",
                "weighted_total",
            ):
                if field in saved_course:
                    merged_course[field] = saved_course[field]

            saved_indicators = {
                indicator.get("indicator_id"): indicator
                for indicator in saved_course.get("indicators", [])
            }
            base_indicators = list(merged_course.get("indicators", []))
            merged_course["indicators"] = []
            for indicator in base_indicators:
                saved_indicator = saved_indicators.get(indicator.get("indicator_id"))
                if not saved_indicator:
                    merged_course["indicators"].append(indicator)
                    continue

                merged_indicator = dict(indicator)
                for key, value in saved_indicator.items():
                    if key != "indicator_id":
                        merged_indicator[key] = value
                merged_course["indicators"].append(merged_indicator)

            merged_courses.append(merged_course)

        merged["courses"] = merged_courses
        return merged

    def _build_course_mapping_lookup(self):
        mapping_rows = CourseSOMapping.objects.prefetch_related("mapped_sos").all()
        exact_lookup = {}
        fallback_lookup = {}

        for mapping in mapping_rows:
            mapped_numbers = {so.number for so in mapping.mapped_sos.all()}
            exact_lookup[(mapping.course_id, mapping.academic_year)] = mapped_numbers

            existing = fallback_lookup.get(mapping.course_id)
            if existing is None or mapping.academic_year > existing["academic_year"]:
                fallback_lookup[mapping.course_id] = {
                    "academic_year": mapping.academic_year,
                    "mapped_numbers": mapped_numbers,
                }

        return exact_lookup, {
            course_id: payload["mapped_numbers"]
            for course_id, payload in fallback_lookup.items()
        }

    def _merge_template_into_table(self, base_table, template):
        if not template:
            merged = dict(base_table)
            merged["report_config_id"] = None
            merged["formula"] = DEFAULT_FORMULA
            merged["variables"] = list(DEFAULT_VARIABLES)
            return merged

        merged = self._merge_saved_table(base_table, template.table_data or {})
        merged["report_config_id"] = template.id
        merged["formula"] = template.formula or DEFAULT_FORMULA
        merged["variables"] = template.variables or list(DEFAULT_VARIABLES)
        return merged

    def _apply_saved_templates(self, tables, school_year="", course_id=None, section_id=None):
        if not tables:
            return tables

        scope_filters = self._report_scope_filters(
            school_year=school_year,
            course_id=course_id,
            section_id=section_id,
        )
        try:
            template_map = {
                template.student_outcome_id: template
                for template in ReportTemplate.objects.filter(
                    student_outcome_id__in=[table["so_id"] for table in tables],
                    **scope_filters,
                )
            }
        except (OperationalError, ProgrammingError):
            template_map = {}

        merged_tables = []
        for table in tables:
            merged_tables.append(
                self._merge_template_into_table(table, template_map.get(table["so_id"]))
            )
        return merged_tables

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

        mapped_so_numbers_by_course_year, fallback_so_numbers_by_course = (
            self._build_course_mapping_lookup()
        )

        grouped_by_so = defaultdict(list)
        for assessment in assessment_rows:
            mapped_numbers = mapped_so_numbers_by_course_year.get(
                (assessment.section.course_id, assessment.school_year)
            )
            if mapped_numbers is None:
                mapped_numbers = fallback_so_numbers_by_course.get(assessment.section.course_id)
            if mapped_numbers is not None and assessment.student_outcome.number not in mapped_numbers:
                continue
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
                        indicator = (
                            grade.criterion.performance_indicator
                            if grade.criterion_id
                            else grade.performance_indicator
                        )
                        if indicator is None:
                            continue
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
                    "target_statement": f"{target_level}% of the class gets satisfactory rating or higher",
                    "conclusion": self._build_default_conclusion(attainment_percent, target_level),
                },
                "report_config_id": None,
                "formula": DEFAULT_FORMULA,
                "variables": list(DEFAULT_VARIABLES),
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
            faculty_names = sorted(
                {
                    faculty_display_name(section.faculty)
                    for section in Section.objects.select_related("faculty")
                    .filter(course_id=c_id, assessments__in=assessments)
                    if section.faculty
                }
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
            Section.objects.exclude(academic_year="")
            .values_list("academic_year", flat=True)
            .distinct()
        )

        all_courses = list(
            Course.objects.values("id", "code", "name").order_by("code")
        )

        all_sections = [
            {
                "id": section.id,
                "name": section.name,
                "course_id": section.course_id,
                "course__code": section.course.code,
                "school_year": section.academic_year,
            }
            for section in Section.objects.select_related("course").order_by("name")
        ]

        all_sos = list(
            StudentOutcome.objects.values("id", "number", "title").order_by("number")
        )

        so_summary_tables = self._apply_saved_templates(
            self._build_so_summary_tables(assessments),
            school_year=school_year,
            course_id=course_id,
            section_id=section_id,
        )

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

    @action(detail=False, methods=["post"], url_path="save_summary_table")
    def save_summary_table(self, request):
        so_id = request.data.get("so_id")
        if not so_id:
            return Response(
                {"detail": "so_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        table_data = request.data.get("table_data")
        if not isinstance(table_data, dict):
            return Response(
                {"detail": "table_data must be an object"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            student_outcome = StudentOutcome.objects.get(id=so_id)
        except StudentOutcome.DoesNotExist:
            return Response(
                {"detail": "Student outcome not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        course_id = request.data.get("course_id") or None
        section_id = request.data.get("section_id") or None
        school_year = request.data.get("school_year", "") or ""

        if course_id:
            try:
                Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response(
                    {"detail": "Course not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        if section_id:
            try:
                Section.objects.get(id=section_id)
            except Section.DoesNotExist:
                return Response(
                    {"detail": "Section not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        try:
            template, _ = ReportTemplate.objects.update_or_create(
                student_outcome=student_outcome,
                course_id=course_id,
                section_id=section_id,
                school_year=school_year,
                defaults={
                    "formula": request.data.get("formula") or DEFAULT_FORMULA,
                    "variables": request.data.get("variables") or list(DEFAULT_VARIABLES),
                    "table_data": table_data,
                },
            )
        except (OperationalError, ProgrammingError):
            return Response(
                {"detail": "Report templates table is not available yet. Run migrations first."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "message": "Report summary saved successfully.",
                "report_template": ReportTemplateSerializer(template).data,
            }
        )

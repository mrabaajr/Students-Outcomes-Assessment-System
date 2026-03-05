from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Avg, Count, Q

from assessment.models import Assessment, Grade
from so.models import StudentOutcome
from courses.models import Course
from classess.models import Section


class ReportViewSet(ViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

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
            "filter_options": {
                "school_years": all_school_years,
                "courses": all_courses,
                "sections": all_sections,
                "student_outcomes": all_sos,
            },
        })
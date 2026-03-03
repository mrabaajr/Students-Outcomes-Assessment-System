from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count

from assessments.models import Assessment, Grade


class ReportViewSet(ViewSet):

    @action(detail=False, methods=["get"])
    def dashboard(self, request):

        school_year = request.query_params.get("school_year")
        section = request.query_params.get("section")
        course = request.query_params.get("course")
        so = request.query_params.get("so")

        assessments = Assessment.objects.select_related(
            "section__course",
            "student_outcome"
        )

        # Apply filters
        if school_year:
            assessments = assessments.filter(school_year=school_year)

        if section:
            assessments = assessments.filter(section_id=section)

        if course:
            assessments = assessments.filter(section__course_id=course)

        if so:
            assessments = assessments.filter(student_outcome_id=so)

        grades = Grade.objects.filter(assessment__in=assessments)

        # ===============================
        # METRICS
        # ===============================

        total_sos = assessments.values(
            "student_outcome"
        ).distinct().count()

        total_courses = assessments.values(
            "section__course"
        ).distinct().count()

        avg_performance = grades.aggregate(
            avg=Avg("score")
        )["avg"] or 0

        # ===============================
        # SO PERFORMANCE
        # ===============================

        so_performance = grades.values(
            "assessment__student_outcome__id",
            "assessment__student_outcome__number",
        ).annotate(
            average=Avg("score")
        ).order_by("assessment__student_outcome__number")

        # ===============================
        # COURSE SUMMARY
        # ===============================

        course_summary_raw = grades.values(
            "assessment__section__course__id",
            "assessment__section__course__code",
            "assessment__section__course__name",
        ).annotate(
            avg_score=Avg("score"),
            total_students=Count("student", distinct=True),
        ).order_by("assessment__section__course__code")

        threshold = 75
        course_summary = []

        for course_data in course_summary_raw:

            course_id = course_data["assessment__section__course__id"]

            student_avgs = grades.filter(
                assessment__section__course_id=course_id
            ).values("student").annotate(
                student_avg=Avg("score")
            )

            total_students = student_avgs.count()
            passed = student_avgs.filter(
                student_avg__gte=threshold
            ).count()

            pass_rate = (
                (passed / total_students) * 100
                if total_students > 0 else 0
            )

            course_summary.append({
                "code": course_data["assessment__section__course__code"],
                "name": course_data["assessment__section__course__name"],
                "avg_score": round(course_data["avg_score"], 2),
                "pass_rate": round(pass_rate, 2),
                "students": total_students
            })

        # ===============================
        # FINAL RESPONSE
        # ===============================

        return Response({
            "metrics": {
                "total_student_outcomes": total_sos,
                "total_courses": total_courses,
                "avg_performance": round(avg_performance, 2),
            },
            "so_average_performance": list(so_performance),
            "course_summary": course_summary,
        })
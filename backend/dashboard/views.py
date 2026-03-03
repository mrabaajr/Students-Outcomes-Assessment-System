from rest_framework.viewsets import ViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from django.utils.timezone import now
from datetime import timedelta

from assessments.models import Assessment, Grade
from so.models import StudentOutcome
from classess.models import Section
from courses.models import Course


class DashboardViewSet(ViewSet):

    @action(detail=False, methods=["get"])
    def overview(self, request):

        school_year = request.query_params.get("school_year")

        assessments = Assessment.objects.select_related(
            "section__course",
            "student_outcome"
        )

        if school_year:
            assessments = assessments.filter(school_year=school_year)

        grades = Grade.objects.filter(assessment__in=assessments)

        # ====================================
        # 1️⃣ KPI METRICS
        # ====================================

        total_sos = StudentOutcome.objects.count()

        total_courses_mapped = Course.objects.filter(
            sections__assessments__isnull=False
        ).distinct().count()

        total_sections_assessed = assessments.values(
            "section"
        ).distinct().count()

        avg_performance = grades.aggregate(
            avg=Avg("score")
        )["avg"] or 0

        metrics = {
            "total_student_outcomes": total_sos,
            "courses_mapped": total_courses_mapped,
            "sections_assessed": total_sections_assessed,
            "avg_performance": round(avg_performance, 2),
        }

        # ====================================
        # 2️⃣ SO PROGRESS
        # ====================================

        threshold = 75

        so_data = grades.values(
            "assessment__student_outcome__id",
            "assessment__student_outcome__number",
            "assessment__student_outcome__name",
        ).annotate(
            avg_score=Avg("score"),
            total_sections=Count("assessment__section", distinct=True),
        ).order_by("assessment__student_outcome__number")

        so_progress = []
        alerts = []

        for so in so_data:
            avg_score = so["avg_score"]

            status = "met"
            if avg_score < 65:
                status = "critical"
            elif avg_score < threshold:
                status = "at_risk"

            if status != "met":
                alerts.append({
                    "so_number": so["assessment__student_outcome__number"],
                    "message": f"SO{so['assessment__student_outcome__number']} is below threshold.",
                    "avg_score": round(avg_score, 2),
                })

            so_progress.append({
                "so_number": so["assessment__student_outcome__number"],
                "name": so["assessment__student_outcome__name"],
                "avg_score": round(avg_score, 2),
                "target": threshold,
                "sections_assessed": so["total_sections"],
                "status": status,
            })

        # ====================================
        # 3️⃣ RECENT ACTIVITY
        # ====================================

        last_week = now() - timedelta(days=7)

        recent_assessments = Assessment.objects.filter(
            created_at__gte=last_week
        ).order_by("-created_at")[:5]

        recent_activity = []

        for assessment in recent_assessments:
            recent_activity.append({
                "type": "assessment_created",
                "message": f"SO{assessment.student_outcome.number} assessment created for {assessment.section}",
                "created_at": assessment.created_at,
            })

        # ====================================
        # FINAL RESPONSE
        # ====================================

        return Response({
            "metrics": metrics,
            "so_progress": so_progress,
            "alerts": alerts,
            "recent_activity": recent_activity,
        })
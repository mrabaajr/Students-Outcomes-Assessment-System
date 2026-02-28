from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import StudentOutcome, PerformanceIndicator
from .serializers import (
    StudentOutcomeSerializer,
    PerformanceIndicatorSerializer,
)


# ---------------------------------
# Student Outcome ViewSet
# ---------------------------------

class StudentOutcomeViewSet(viewsets.ModelViewSet):
    """
    Full CRUD support.
    Returns nested PIs and Criteria.
    """

    queryset = StudentOutcome.objects.prefetch_related(
        "performance_indicators__criteria"
    ).all()

    serializer_class = StudentOutcomeSerializer
    permission_classes = [AllowAny]


# ---------------------------------
# Performance Indicator ViewSet
# ---------------------------------

class PerformanceIndicatorViewSet(viewsets.ModelViewSet):
    """
    CRUD for Performance Indicators.
    Can filter by student_outcome via query param.
    """

    queryset = PerformanceIndicator.objects.prefetch_related("criteria").all()
    serializer_class = PerformanceIndicatorSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        so_id = self.request.query_params.get("student_outcome")

        if so_id:
            queryset = queryset.filter(student_outcome_id=so_id)

        return queryset
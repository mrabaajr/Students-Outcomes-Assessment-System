from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from .models import StudentOutcome, PerformanceIndicator, PerformanceCriterion
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
    authentication_classes = []

    @action(detail=False, methods=['post'], url_path='bulk_save')
    def bulk_save(self, request):
        """
        Bulk save student outcomes, performance indicators, and criteria.
        Expects: { outcomes: [ { id, number, title, description, performanceIndicators: [...] } ] }
        """
        outcomes_data = request.data.get('outcomes', [])
        if not outcomes_data:
            return Response({'detail': 'No outcomes provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                saved_ids = set()
                saved_outcomes = []

                for so_data in outcomes_data:
                    so_id = so_data.get('id')
                    so_number = so_data.get('number', 1)
                    so_title = so_data.get('title', '')
                    so_desc = so_data.get('description', '')

                    if so_id and isinstance(so_id, int):
                        so_obj, _ = StudentOutcome.objects.update_or_create(
                            id=so_id,
                            defaults={'number': so_number, 'title': so_title, 'description': so_desc},
                        )
                    else:
                        so_obj = StudentOutcome.objects.create(
                            number=so_number, title=so_title, description=so_desc,
                        )
                    saved_ids.add(so_obj.id)

                    # Performance Indicators
                    pi_saved_ids = set()
                    for pi_data in so_data.get('performanceIndicators', []):
                        pi_id = pi_data.get('id')
                        pi_number = pi_data.get('number', 1)
                        pi_desc = pi_data.get('description', '')

                        if pi_id and isinstance(pi_id, int):
                            pi_obj, _ = PerformanceIndicator.objects.update_or_create(
                                id=pi_id,
                                defaults={
                                    'student_outcome': so_obj,
                                    'number': pi_number,
                                    'description': pi_desc,
                                },
                            )
                        else:
                            pi_obj = PerformanceIndicator.objects.create(
                                student_outcome=so_obj,
                                number=pi_number,
                                description=pi_desc,
                            )
                        pi_saved_ids.add(pi_obj.id)

                        # Performance Criteria
                        pc_saved_ids = set()
                        for pc_idx, pc_data in enumerate(pi_data.get('performanceCriteria', [])):
                            pc_id = pc_data.get('id')
                            pc_name = pc_data.get('name', pc_data.get('description', ''))
                            pc_order = pc_data.get('order', pc_idx + 1)

                            if pc_id and isinstance(pc_id, int):
                                pc_obj, _ = PerformanceCriterion.objects.update_or_create(
                                    id=pc_id,
                                    defaults={
                                        'performance_indicator': pi_obj,
                                        'name': pc_name,
                                        'order': pc_order,
                                    },
                                )
                            else:
                                pc_obj = PerformanceCriterion.objects.create(
                                    performance_indicator=pi_obj,
                                    name=pc_name,
                                    order=pc_order,
                                )
                            pc_saved_ids.add(pc_obj.id)

                        # Remove deleted criteria
                        PerformanceCriterion.objects.filter(
                            performance_indicator=pi_obj
                        ).exclude(id__in=pc_saved_ids).delete()

                    # Remove deleted PIs
                    PerformanceIndicator.objects.filter(
                        student_outcome=so_obj
                    ).exclude(id__in=pi_saved_ids).delete()

                # Remove deleted SOs
                StudentOutcome.objects.exclude(id__in=saved_ids).delete()

                # Reload and return
                all_sos = StudentOutcome.objects.prefetch_related(
                    'performance_indicators__criteria'
                ).all()
                serializer = StudentOutcomeSerializer(all_sos, many=True)
                return Response({'outcomes': serializer.data, 'success': True})

        except Exception as e:
            return Response(
                {'detail': f'Error saving outcomes: {str(e)}', 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
    authentication_classes = []

    def get_queryset(self):
        queryset = super().get_queryset()
        so_id = self.request.query_params.get("student_outcome")

        if so_id:
            queryset = queryset.filter(student_outcome_id=so_id)

        return queryset
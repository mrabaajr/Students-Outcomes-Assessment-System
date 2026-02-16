from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from .models import StudentOutcome, PerformanceIndicator
from .serializers import (
    StudentOutcomeSerializer, 
    StudentOutcomeCreateSerializer,
    PerformanceIndicatorSerializer,
    PerformanceIndicatorCreateSerializer,
    BulkStudentOutcomeSerializer
)


class StudentOutcomeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Student Outcomes CRUD operations.
    Supports bulk save for syncing frontend state with backend.
    """
    queryset = StudentOutcome.objects.prefetch_related('performance_indicators').all()
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StudentOutcomeCreateSerializer
        return StudentOutcomeSerializer

    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        """
        Bulk save all student outcomes and their performance indicators.
        This replaces all existing data with the new data from frontend.
        Expected format:
        {
            "outcomes": [
                {
                    "id": "1" or null for new,
                    "number": 1,
                    "title": "SO Title",
                    "description": "Description",
                    "performanceIndicators": [
                        {"id": "1-1" or null, "number": 1, "description": "PI desc"}
                    ]
                }
            ]
        }
        """
        outcomes_data = request.data.get('outcomes', [])
        
        if not outcomes_data:
            return Response(
                {'detail': 'No outcomes data provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Track which IDs we're keeping
                frontend_so_ids = set()
                frontend_pi_ids = set()
                
                saved_outcomes = []
                
                for so_data in outcomes_data:
                    so_id = so_data.get('id')
                    
                    # Check if this is an existing SO (numeric ID) or new one (string like timestamp)
                    existing_so = None
                    if so_id:
                        try:
                            existing_so = StudentOutcome.objects.get(pk=int(so_id))
                        except (ValueError, StudentOutcome.DoesNotExist):
                            existing_so = None
                    
                    if existing_so:
                        # Update existing SO
                        existing_so.number = so_data.get('number', existing_so.number)
                        existing_so.title = so_data.get('title', existing_so.title)
                        existing_so.description = so_data.get('description', existing_so.description)
                        existing_so.save()
                        so_instance = existing_so
                    else:
                        # Create new SO
                        so_instance = StudentOutcome.objects.create(
                            number=so_data.get('number'),
                            title=so_data.get('title', f"T.I.P. SO {so_data.get('number')}"),
                            description=so_data.get('description', '')
                        )
                    
                    frontend_so_ids.add(so_instance.id)
                    
                    # Handle Performance Indicators
                    pi_data_list = so_data.get('performanceIndicators', [])
                    for pi_data in pi_data_list:
                        pi_id = pi_data.get('id')
                        
                        # Try to find existing PI
                        existing_pi = None
                        if pi_id:
                            try:
                                existing_pi = PerformanceIndicator.objects.get(pk=int(pi_id))
                            except (ValueError, PerformanceIndicator.DoesNotExist):
                                existing_pi = None
                        
                        if existing_pi and existing_pi.student_outcome_id == so_instance.id:
                            # Update existing PI
                            existing_pi.number = pi_data.get('number', existing_pi.number)
                            existing_pi.description = pi_data.get('description', existing_pi.description)
                            existing_pi.save()
                            pi_instance = existing_pi
                        else:
                            # Create new PI
                            pi_instance = PerformanceIndicator.objects.create(
                                student_outcome=so_instance,
                                number=pi_data.get('number'),
                                description=pi_data.get('description', '')
                            )
                        
                        frontend_pi_ids.add(pi_instance.id)
                    
                    # Delete PIs that were removed for this SO
                    PerformanceIndicator.objects.filter(
                        student_outcome=so_instance
                    ).exclude(id__in=frontend_pi_ids).delete()
                    
                    saved_outcomes.append(so_instance)
                
                # Delete SOs that were removed (not in frontend data)
                StudentOutcome.objects.exclude(id__in=frontend_so_ids).delete()
                
                # Return the saved data
                serializer = StudentOutcomeSerializer(saved_outcomes, many=True)
                return Response({
                    'message': 'Changes saved successfully',
                    'outcomes': serializer.data
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {'detail': f'Error saving changes: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PerformanceIndicatorViewSet(viewsets.ModelViewSet):
    """ViewSet for Performance Indicators CRUD operations"""
    queryset = PerformanceIndicator.objects.all()
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PerformanceIndicatorCreateSerializer
        return PerformanceIndicatorSerializer
    
    def get_queryset(self):
        queryset = PerformanceIndicator.objects.all()
        so_id = self.request.query_params.get('student_outcome', None)
        if so_id is not None:
            queryset = queryset.filter(student_outcome_id=so_id)
        return queryset

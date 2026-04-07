from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from .models import Assessment, Grade
from .serializers import AssessmentSerializer
from classess.models import Section, Student
from so.models import StudentOutcome, PerformanceCriterion


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.prefetch_related('grades').all()
    serializer_class = AssessmentSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    @action(detail=False, methods=['get'], url_path='load_grades')
    def load_grades(self, request):
        """Load grades for a specific section + SO + school_year."""
        section_id = request.query_params.get('section_id')
        so_id = request.query_params.get('so_id')
        school_year = request.query_params.get('school_year', '')

        if not section_id or not so_id:
            return Response({'detail': 'section_id and so_id are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            assessment = Assessment.objects.get(
                section_id=section_id,
                student_outcome_id=so_id,
                school_year=school_year,
            )
        except Assessment.DoesNotExist:
            return Response({'grades': {}})

        grades_payload = {}
        for grade in assessment.grades.all():
            student_key = str(grade.student_id)
            if student_key not in grades_payload:
                grades_payload[student_key] = {}
            grades_payload[student_key][str(grade.criterion_id)] = grade.score

        return Response({'grades': grades_payload})

    @action(detail=False, methods=['post'], url_path='save_grades')
    def save_grades(self, request):
        """Save all grades for a section + SO + school_year."""
        section_id = request.data.get('section_id')
        so_id = request.data.get('so_id')
        school_year = request.data.get('school_year', '')
        grades_data = request.data.get('grades', {})

        if not section_id or not so_id:
            return Response({'detail': 'section_id and so_id are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                assessment, _ = Assessment.objects.update_or_create(
                    section_id=section_id,
                    student_outcome_id=so_id,
                    school_year=school_year,
                )

                # Clear existing grades for this assessment
                Grade.objects.filter(assessment=assessment).delete()

                # Save new grades
                for student_id_str, criteria_grades in grades_data.items():
                    for criterion_id_str, score in criteria_grades.items():
                        if score is not None:
                            Grade.objects.create(
                                assessment=assessment,
                                student_id=int(student_id_str),
                                criterion_id=int(criterion_id_str),
                                score=int(score),
                            )

            return Response({'success': True, 'message': 'Grades saved successfully'})
        except Exception as e:
            return Response(
                {'detail': f'Error saving grades: {str(e)}', 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


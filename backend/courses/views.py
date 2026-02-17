# courses/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import CourseSOMapping
from .serializers import (
    CourseSOMappingSerializer,
    CourseSOMappingCreateUpdateSerializer,
    CourseSOMappingSOToggleSerializer
)
from so.models import StudentOutcome


class CourseSOMappingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing CourseSOMapping (courses with SOs)
    """
    queryset = CourseSOMapping.objects.prefetch_related('mapped_sos').all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CourseSOMappingCreateUpdateSerializer
        return CourseSOMappingSerializer

    def get_queryset(self):
        """Filter by curriculum, year_level, semester, academic_year, or search term"""
        queryset = CourseSOMapping.objects.prefetch_related('mapped_sos').all()

        # Filter by curriculum
        curriculum = self.request.query_params.get('curriculum', None)
        if curriculum:
            queryset = queryset.filter(curriculum_id=curriculum)

        # Filter by year_level
        year_level = self.request.query_params.get('year_level', None)
        if year_level:
            queryset = queryset.filter(year_level=year_level)

        # Filter by semester
        semester = self.request.query_params.get('semester', None)
        if semester:
            queryset = queryset.filter(semester=semester)

        # Filter by academic_year
        academic_year = self.request.query_params.get('academic_year', None)
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)

        # Search by code or name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'])
    def toggle_so(self, request, pk=None):
        """Toggle SO mapping for a specific CourseSOMapping"""
        mapping = self.get_object()
        serializer = CourseSOMappingSOToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        so_id = serializer.validated_data['so_id']
        should_map = serializer.validated_data['should_map']

        try:
            so = StudentOutcome.objects.get(id=so_id)
        except StudentOutcome.DoesNotExist:
            return Response({'detail': 'Student Outcome not found'}, status=status.HTTP_404_NOT_FOUND)

        if should_map:
            mapping.mapped_sos.add(so)
            message = f'SO {so.number} mapped to course mapping'
        else:
            mapping.mapped_sos.remove(so)
            message = f'SO {so.number} unmapped from course mapping'

        output_serializer = CourseSOMappingSerializer(mapping)
        return Response({'message': message, 'courseMapping': output_serializer.data})

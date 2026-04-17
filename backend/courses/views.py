from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from so.models import StudentOutcome

from .models import Course, CourseSOMapping, Curriculum, SchoolYear
from .serializers import (
    CourseSerializer,
    CourseSOMappingCreateUpdateSerializer,
    CourseSOMappingSerializer,
    CourseSOMappingSOToggleSerializer,
    CurriculumSerializer,
    SchoolYearSerializer,
)


class CourseSOMappingViewSet(viewsets.ModelViewSet):
    queryset = CourseSOMapping.objects.prefetch_related('mapped_sos').all()
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CourseSOMappingCreateUpdateSerializer
        return CourseSOMappingSerializer

    def get_queryset(self):
        queryset = CourseSOMapping.objects.prefetch_related('mapped_sos').all()

        curriculum = self.request.query_params.get('curriculum')
        if curriculum:
            curriculum_str = str(curriculum).strip()
            if Curriculum.objects.filter(year=curriculum_str).exists():
                queryset = queryset.filter(curriculum__year=curriculum)
            elif curriculum_str.isdigit():
                queryset = queryset.filter(curriculum_id=int(curriculum_str))
            else:
                queryset = queryset.filter(curriculum__year=curriculum_str)

        year_level = self.request.query_params.get('year_level')
        if year_level:
            queryset = queryset.filter(year_level=year_level)

        semester = self.request.query_params.get('semester')
        if semester:
            queryset = queryset.filter(semester=semester)

        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mapping = serializer.save()
        output_serializer = CourseSOMappingSerializer(mapping)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        mapping = serializer.save()
        output_serializer = CourseSOMappingSerializer(mapping)
        return Response(output_serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_so(self, request, pk=None):
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


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class SchoolYearViewSet(viewsets.ModelViewSet):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.select_related('curriculum').all()
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        queryset = super().get_queryset()

        curriculum = self.request.query_params.get('curriculum')
        if curriculum:
            curriculum_str = str(curriculum).strip()
            if Curriculum.objects.filter(year=curriculum_str).exists():
                queryset = queryset.filter(curriculum__year=curriculum_str)
            elif curriculum_str.isdigit():
                queryset = queryset.filter(curriculum_id=int(curriculum_str))
            else:
                queryset = queryset.filter(curriculum__year=curriculum_str)

        return queryset

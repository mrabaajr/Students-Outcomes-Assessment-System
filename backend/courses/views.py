from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from so.models import StudentOutcome
from users.audit import log_audit_event

from .models import Course, CourseSOMapping, Curriculum, SchoolYear
from .serializers import (
    CourseCreateUpdateSerializer,
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
        log_audit_event(
            request,
            action="create",
            target_type="course mapping",
            target_name=f"{mapping.code} {mapping.academic_year}",
            description=f"Created course mapping for {mapping.code}.",
            metadata={"mapping_id": mapping.id},
        )
        output_serializer = CourseSOMappingSerializer(mapping)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        mapping = serializer.save()
        log_audit_event(
            request,
            action="update",
            target_type="course mapping",
            target_name=f"{mapping.code} {mapping.academic_year}",
            description=f"Updated course mapping for {mapping.code}.",
            metadata={"mapping_id": mapping.id},
        )
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

        log_audit_event(
            request,
            action="update",
            target_type="course mapping",
            target_name=f"{mapping.code} {mapping.academic_year}",
            description=message,
            metadata={"mapping_id": mapping.id, "so_id": so.id, "should_map": should_map},
        )

        output_serializer = CourseSOMappingSerializer(mapping)
        return Response({'message': message, 'courseMapping': output_serializer.data})


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumSerializer
    permission_classes = [AllowAny]


class SchoolYearViewSet(viewsets.ModelViewSet):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [AllowAny]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('curriculum').all()
    permission_classes = [AllowAny]

    def _sync_related_mappings(self, course):
        for mapping in course.so_mappings.all():
            mapping.code = course.code
            mapping.name = course.name
            mapping.curriculum = course.curriculum
            mapping.year_level = course.year_level
            mapping.semester = course.semester
            mapping.credits = course.credits
            mapping.description = course.description
            mapping.save()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        return CourseSerializer

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

        semester = self.request.query_params.get('semester')
        if semester:
            queryset = queryset.filter(semester=semester)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        log_audit_event(
            request,
            action="create",
            target_type="course",
            target_name=course.code,
            description=f"Created base course {course.code}.",
            metadata={"course_id": course.id},
        )
        output_serializer = CourseSerializer(course)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        self._sync_related_mappings(course)
        log_audit_event(
            request,
            action="update",
            target_type="course",
            target_name=course.code,
            description=f"Updated base course {course.code}.",
            metadata={"course_id": course.id},
        )
        output_serializer = CourseSerializer(course)
        return Response(output_serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_so_mapping(self, request, pk=None):
        course = self.get_object()
        serializer = CourseSOMappingSOToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        academic_year = request.data.get('academic_year')
        if not academic_year:
            return Response({'detail': 'academic_year is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not SchoolYear.objects.filter(year=academic_year).exists():
            return Response({'detail': 'Please select a valid school year.'}, status=status.HTTP_400_BAD_REQUEST)

        semester = request.data.get('semester') or course.semester
        should_map = serializer.validated_data['should_map']
        so_id = serializer.validated_data['so_id']

        try:
            so = StudentOutcome.objects.get(id=so_id)
        except StudentOutcome.DoesNotExist:
            return Response({'detail': 'Student Outcome not found'}, status=status.HTTP_404_NOT_FOUND)

        mapping, _ = CourseSOMapping.objects.get_or_create(
            course=course,
            curriculum=course.curriculum,
            academic_year=academic_year,
            semester=semester,
            defaults={
                'code': course.code,
                'name': course.name,
                'year_level': course.year_level,
                'credits': course.credits,
                'description': course.description,
            },
        )

        updated_fields = []
        for field in ('code', 'name', 'year_level', 'semester', 'credits', 'description'):
            value = getattr(course, field)
            if getattr(mapping, field) != value:
                setattr(mapping, field, value)
                updated_fields.append(field)
        if mapping.curriculum_id != course.curriculum_id:
            mapping.curriculum = course.curriculum
            updated_fields.append('curriculum')
        if updated_fields:
            mapping.save(update_fields=updated_fields)

        if should_map:
            mapping.mapped_sos.add(so)
            message = f'SO {so.number} mapped to course'
        else:
            mapping.mapped_sos.remove(so)
            message = f'SO {so.number} unmapped from course'

        log_audit_event(
            request,
            action="update",
            target_type="course mapping",
            target_name=f"{mapping.code} {mapping.academic_year}",
            description=message,
            metadata={"mapping_id": mapping.id, "course_id": course.id, "so_id": so.id, "should_map": should_map},
        )

        output_serializer = CourseSOMappingSerializer(mapping)
        return Response({'message': message, 'courseMapping': output_serializer.data})

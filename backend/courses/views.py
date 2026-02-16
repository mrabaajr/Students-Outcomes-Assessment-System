from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from .models import Course
from .serializers import CourseSerializer, CourseCreateUpdateSerializer, CourseSOToggleSerializer
from so.models import StudentOutcome


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course CRUD operations.
    """
    queryset = Course.objects.prefetch_related('mapped_sos').all()
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def get_queryset(self):
        """Support filtering by department, academic_year, and search term"""
        queryset = Course.objects.prefetch_related('mapped_sos').all()
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department and department != 'All Departments':
            queryset = queryset.filter(department=department)
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year', None)
        if academic_year and academic_year != 'All Years':
            queryset = queryset.filter(academic_year=academic_year)
        
        # Search by code or name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )
        
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        
        # Return with full course details
        output_serializer = CourseSerializer(course)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        
        # Return with full course details
        output_serializer = CourseSerializer(course)
        return Response(output_serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_so(self, request, pk=None):
        """Toggle SO mapping for a specific course"""
        course = self.get_object()
        serializer = CourseSOToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        so_id = serializer.validated_data['so_id']
        should_map = serializer.validated_data['should_map']
        
        try:
            so = StudentOutcome.objects.get(id=so_id)
        except StudentOutcome.DoesNotExist:
            return Response(
                {'detail': 'Student Outcome not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if should_map:
            course.mapped_sos.add(so)
            message = f'SO {so.number} mapped to course'
        else:
            course.mapped_sos.remove(so)
            message = f'SO {so.number} unmapped from course'
        
        output_serializer = CourseSerializer(course)
        return Response({
            'message': message,
            'course': output_serializer.data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get course statistics"""
        total_courses = Course.objects.count()
        active_courses = Course.objects.filter(status='active').count()
        departments = Course.objects.values_list('department', flat=True).distinct()
        total_students = sum(Course.objects.values_list('student_count', flat=True))
        
        return Response({
            'total_courses': total_courses,
            'active_courses': active_courses,
            'departments_count': len(departments),
            'total_students': total_students,
        })

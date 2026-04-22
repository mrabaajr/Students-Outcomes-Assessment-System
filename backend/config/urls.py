"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

from users.views import AuditLogViewSet, UserViewSet
from so.views import StudentOutcomeViewSet, PerformanceIndicatorViewSet
from courses.views import (CourseSOMappingViewSet, CurriculumViewSet, CourseViewSet, SchoolYearViewSet)
from classess.views import (StudentViewSet,SectionViewSet,EnrollmentViewSet,)
from assessment.views import AssessmentViewSet
from reports.views import ReportViewSet


def root_view(request):
    return JsonResponse({
        'message': 'Students Outcomes Assessment System API',
        'version': '1.0',
        'endpoints': {
            'api': '/api/',
            'admin': '/admin/',
            'token': '/api/token/',
            'token_refresh': '/api/token/refresh/',
        }
    })

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'student-outcomes', StudentOutcomeViewSet, basename='student-outcome')
router.register(r'performance-indicators', PerformanceIndicatorViewSet, basename='performance-indicator')


router.register(r'course-so-mappings', CourseSOMappingViewSet, basename='course-so-mapping')
router.register(r'curricula', CurriculumViewSet, basename='curriculum')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'school-years', SchoolYearViewSet, basename='school-year')
router.register(r'academic-years', SchoolYearViewSet, basename='academic-year')

router.register(r'students', StudentViewSet, basename='student')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'reports', ReportViewSet, basename='report')


urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

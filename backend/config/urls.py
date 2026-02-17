"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter

from users.views import UserViewSet
from assessments.views import LearningOutcomeViewSet, AssessmentViewSet, AssessmentResultViewSet
from so.views import StudentOutcomeViewSet, PerformanceIndicatorViewSet
from courses.views import (CourseSOMappingViewSet,CurriculumViewSet,CourseViewSet,)


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
router.register(r'assessments/outcomes', LearningOutcomeViewSet, basename='learning-outcome')
router.register(r'assessments/assessments', AssessmentViewSet, basename='assessment')
router.register(r'assessments/results', AssessmentResultViewSet, basename='assessment-result')
router.register(r'student-outcomes', StudentOutcomeViewSet, basename='student-outcome')
router.register(r'performance-indicators', PerformanceIndicatorViewSet, basename='performance-indicator')


router.register(r'course-so-mappings', CourseSOMappingViewSet, basename='course-so-mapping')
router.register(r'curricula', CurriculumViewSet, basename='curriculum')
router.register(r'courses', CourseViewSet, basename='course')


urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

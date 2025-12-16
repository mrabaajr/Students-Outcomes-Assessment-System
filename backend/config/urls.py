"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from assessments.views import LearningOutcomeViewSet, AssessmentViewSet, AssessmentResultViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'assessments/outcomes', LearningOutcomeViewSet, basename='learning-outcome')
router.register(r'assessments/assessments', AssessmentViewSet, basename='assessment')
router.register(r'assessments/results', AssessmentResultViewSet, basename='assessment-result')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

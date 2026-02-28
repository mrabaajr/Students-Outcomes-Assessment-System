from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Assessment, Grade
from .serializers import AssessmentDetailSerializer
from classess.models import Section
from so.models import StudentOutcome, PerformanceIndicator


class AssessmentDetailView(APIView):

    def get(self, request):
        section_id = request.query_params.get("section")
        so_id = request.query_params.get("so")
        school_year = request.query_params.get("year", "2023-2024")

        if not section_id or not so_id:
            return Response(
                {"error": "section and so required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        assessment, created = Assessment.objects.get_or_create(
            section_id=section_id,
            student_outcome_id=so_id,
            school_year=school_year
        )

        serializer = AssessmentDetailSerializer(assessment)
        return Response(serializer.data)


class SaveAssessmentView(APIView):

    def post(self, request):
        assessment_id = request.data.get("assessment_id")
        students = request.data.get("students", [])

        assessment = Assessment.objects.get(id=assessment_id)

        for student_data in students:
            student_id = student_data["id"]
            grades = student_data["grades"]

            for pi_id, score in grades.items():
                Grade.objects.update_or_create(
                    assessment=assessment,
                    student_id=student_id,
                    performance_indicator_id=pi_id,
                    defaults={"score": score}
                )

        return Response({"message": "Saved successfully"})
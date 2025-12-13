from rest_framework import serializers
from .models import LearningOutcome, Assessment, AssessmentResult
from users.serializers import UserSerializer

class LearningOutcomeSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = LearningOutcome
        fields = ('id', 'title', 'description', 'created_by', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

class AssessmentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    learning_outcome = LearningOutcomeSerializer(read_only=True)
    learning_outcome_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Assessment
        fields = ('id', 'title', 'description', 'learning_outcome', 'learning_outcome_id', 'created_by', 'assessment_date', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

class AssessmentResultSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assessment = AssessmentSerializer(read_only=True)
    assessment_id = serializers.IntegerField(write_only=True, required=False)
    student_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = AssessmentResult
        fields = ('id', 'assessment', 'assessment_id', 'student', 'student_id', 'score', 'comments', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

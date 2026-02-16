from rest_framework import serializers
from .models import Course
from so.models import StudentOutcome
from so.serializers import StudentOutcomeSerializer


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course with mapped SOs"""
    mapped_sos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=StudentOutcome.objects.all(),
        required=False
    )
    # Also return SO details for display
    mapped_sos_details = StudentOutcomeSerializer(
        source='mapped_sos',
        many=True,
        read_only=True
    )
    # Frontend expects mappedSOs format
    mappedSOs = serializers.SerializerMethodField()
    # Frontend expects academicYear (camelCase)
    academicYear = serializers.CharField(source='academic_year')
    studentCount = serializers.IntegerField(source='student_count')

    class Meta:
        model = Course
        fields = (
            'id', 'code', 'name', 'section', 'department', 'description',
            'credits', 'semester', 'academic_year', 'academicYear',
            'instructor', 'student_count', 'studentCount', 'status',
            'mapped_sos', 'mapped_sos_details', 'mappedSOs',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'mapped_sos_details', 'mappedSOs')

    def get_mappedSOs(self, obj):
        """Return mapped SO IDs in format expected by frontend (e.g., ['1', '2'])"""
        return [str(so.id) for so in obj.mapped_sos.all()]


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses"""
    # Accept mappedSOs from frontend (list of SO IDs as strings)
    mappedSOs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )
    academicYear = serializers.CharField(source='academic_year')
    studentCount = serializers.IntegerField(source='student_count', default=0)

    class Meta:
        model = Course
        fields = (
            'id', 'code', 'name', 'section', 'department', 'description',
            'credits', 'semester', 'academicYear',
            'instructor', 'studentCount', 'status',
            'mappedSOs'
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        mapped_so_ids = validated_data.pop('mappedSOs', [])
        course = Course.objects.create(**validated_data)
        
        # Handle SO mapping
        if mapped_so_ids:
            so_ids = [int(so_id) for so_id in mapped_so_ids if so_id.isdigit()]
            sos = StudentOutcome.objects.filter(id__in=so_ids)
            course.mapped_sos.set(sos)
        
        return course

    def update(self, instance, validated_data):
        mapped_so_ids = validated_data.pop('mappedSOs', None)
        
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update SO mapping if provided
        if mapped_so_ids is not None:
            so_ids = [int(so_id) for so_id in mapped_so_ids if so_id.isdigit()]
            sos = StudentOutcome.objects.filter(id__in=so_ids)
            instance.mapped_sos.set(sos)
        
        return instance


class CourseSOToggleSerializer(serializers.Serializer):
    """Serializer for toggling SO mapping on a course"""
    so_id = serializers.IntegerField()
    should_map = serializers.BooleanField()

# courses/serializers.py
from rest_framework import serializers
from .models import CourseSOMapping
from so.models import StudentOutcome
from so.serializers import StudentOutcomeSerializer
from .models import Curriculum, Course


class CourseSOMappingSerializer(serializers.ModelSerializer):
    """Serializer for reading CourseSOMapping with mapped SOs"""
    mapped_sos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=StudentOutcome.objects.all(),
        required=False
    )
    mapped_sos_details = StudentOutcomeSerializer(
        source='mapped_sos',
        many=True,
        read_only=True
    )
    mappedSOs = serializers.SerializerMethodField()

    class Meta:
        model = CourseSOMapping
        fields = (
            'id', 'course', 'code', 'name', 'curriculum', 'year_level',
            'semester', 'credits', 'description', 'academic_year',  # <-- added
            'mapped_sos', 'mapped_sos_details', 'mappedSOs',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'mapped_sos_details', 'mappedSOs')

    def get_mappedSOs(self, obj):
        return [str(so.id) for so in obj.mapped_sos.all()]



class CourseSOMappingCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating CourseSOMapping with mapped SOs"""
    mappedSOs = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = CourseSOMapping
        fields = (
            'id', 'course', 'code', 'name', 'curriculum', 'year_level',
            'semester', 'credits', 'description', 'academic_year',  # <-- added
            'mappedSOs'
        )
        read_only_fields = ('id',)

    def create(self, validated_data):
        mapped_so_ids = validated_data.pop('mappedSOs', [])
        mapping = CourseSOMapping.objects.create(**validated_data)

        if mapped_so_ids:
            so_ids = [int(so_id) for so_id in mapped_so_ids if so_id.isdigit()]
            sos = StudentOutcome.objects.filter(id__in=so_ids)
            mapping.mapped_sos.set(sos)

        return mapping

    def update(self, instance, validated_data):
        mapped_so_ids = validated_data.pop('mappedSOs', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if mapped_so_ids is not None:
            so_ids = [int(so_id) for so_id in mapped_so_ids if so_id.isdigit()]
            sos = StudentOutcome.objects.filter(id__in=so_ids)
            instance.mapped_sos.set(sos)

        return instance



class CourseSOMappingSOToggleSerializer(serializers.Serializer):
    """Serializer for toggling SO mapping on a CourseSOMapping"""
    so_id = serializers.IntegerField()
    should_map = serializers.BooleanField()

class CurriculumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curriculum
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
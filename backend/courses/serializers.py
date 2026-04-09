# courses/serializers.py
from rest_framework import serializers
from .models import CourseSOMapping
from so.models import StudentOutcome
from so.serializers import StudentOutcomeSerializer
from .models import Curriculum, Course, SchoolYear


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
    curriculum_year = serializers.CharField(source='curriculum.year', read_only=True)

    class Meta:
        model = CourseSOMapping
        fields = (
            'id', 'course', 'code', 'name', 'curriculum', 'year_level',
            'semester', 'credits', 'description', 'academic_year',
            'curriculum_year',
            'mapped_sos', 'mapped_sos_details', 'mappedSOs',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'mapped_sos_details', 'mappedSOs')

    def get_mappedSOs(self, obj):
        return [str(so.id) for so in obj.mapped_sos.all()]



class CourseSOMappingCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating CourseSOMapping with mapped SOs"""
    course = serializers.IntegerField(required=False, allow_null=True)
    curriculum = serializers.CharField()
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

    def _resolve_curriculum(self, curriculum_value):
        if curriculum_value in (None, ''):
            raise serializers.ValidationError({'curriculum': 'This field is required.'})

        curriculum_str = str(curriculum_value).strip()

        if curriculum_str.isdigit():
            curriculum = Curriculum.objects.filter(id=int(curriculum_str)).first()
            if curriculum:
                return curriculum

        curriculum, _ = Curriculum.objects.get_or_create(year=curriculum_str)
        return curriculum

    def validate_academic_year(self, value):
        if value in (None, ''):
            raise serializers.ValidationError('This field is required.')

        if not SchoolYear.objects.filter(year=value).exists():
            raise serializers.ValidationError('Please select a valid school year.')

        return value

    def _resolve_course(self, validated_data, curriculum, instance=None):
        course_id = validated_data.pop('course', None)

        if course_id:
            course = Course.objects.filter(id=course_id).first()
            if course:
                updates = []
                for field in ('code', 'name', 'year_level', 'semester', 'credits', 'description'):
                    value = validated_data.get(field)
                    if value not in (None, '') and getattr(course, field) != value:
                        setattr(course, field, value)
                        updates.append(field)
                if course.curriculum_id != curriculum.id:
                    course.curriculum = curriculum
                    updates.append('curriculum')
                if updates:
                    course.save(update_fields=updates)
                return course

        if instance is not None and instance.course_id:
            course = instance.course
            updates = []
            for field in ('code', 'name', 'year_level', 'semester', 'credits', 'description'):
                value = validated_data.get(field)
                if value not in (None, '') and getattr(course, field) != value:
                    setattr(course, field, value)
                    updates.append(field)
            if course.curriculum_id != curriculum.id:
                course.curriculum = curriculum
                updates.append('curriculum')
            if updates:
                course.save(update_fields=updates)
            return course

        code = validated_data.get('code', '').strip()
        name = validated_data.get('name', '').strip()
        year_level = validated_data.get('year_level', '').strip()
        semester = validated_data.get('semester', '').strip()

        if not code or not name:
            raise serializers.ValidationError({'course': 'Select an existing course or provide course code and name.'})

        if not year_level:
            raise serializers.ValidationError({'year_level': 'This field is required.'})

        if not semester:
            raise serializers.ValidationError({'semester': 'This field is required.'})

        course, _ = Course.objects.get_or_create(
            code=code,
            curriculum=curriculum,
            defaults={
                'name': name,
                'year_level': year_level,
                'semester': semester,
                'credits': validated_data.get('credits', 3),
                'description': validated_data.get('description', ''),
            },
        )

        updates = []
        for field in ('name', 'year_level', 'semester', 'credits', 'description'):
            value = validated_data.get(field)
            if value not in (None, '') and getattr(course, field) != value:
                setattr(course, field, value)
                updates.append(field)
        if updates:
            course.save(update_fields=updates)
        return course

    def create(self, validated_data):
        mapped_so_ids = validated_data.pop('mappedSOs', [])
        curriculum = self._resolve_curriculum(validated_data.pop('curriculum', None))
        course = self._resolve_course(validated_data, curriculum)
        mapping_defaults = {
            'code': validated_data.get('code', course.code),
            'name': validated_data.get('name', course.name),
            'year_level': validated_data.get('year_level', course.year_level),
            'credits': validated_data.get('credits', course.credits),
            'description': validated_data.get('description', course.description),
        }
        mapping, _ = CourseSOMapping.objects.update_or_create(
            course=course,
            curriculum=curriculum,
            academic_year=validated_data['academic_year'],
            semester=validated_data['semester'],
            defaults=mapping_defaults,
        )

        if mapped_so_ids:
            so_ids = [int(so_id) for so_id in mapped_so_ids if so_id.isdigit()]
            sos = StudentOutcome.objects.filter(id__in=so_ids)
            mapping.mapped_sos.set(sos)
        else:
            mapping.mapped_sos.clear()

        return mapping

    def update(self, instance, validated_data):
        mapped_so_ids = validated_data.pop('mappedSOs', None)
        curriculum = self._resolve_curriculum(validated_data.pop('curriculum', instance.curriculum_id))
        course = self._resolve_course(validated_data, curriculum, instance=instance)
        next_academic_year = validated_data.get('academic_year', instance.academic_year)
        next_semester = validated_data.get('semester', instance.semester)

        conflicting_mapping = CourseSOMapping.objects.filter(
            course=course,
            curriculum=curriculum,
            academic_year=next_academic_year,
            semester=next_semester,
        ).exclude(id=instance.id).first()

        if conflicting_mapping:
            raise serializers.ValidationError(
                {
                    'academic_year': 'A course SO mapping already exists for this course, school year, and semester.',
                }
            )

        instance.course = course
        instance.curriculum = curriculum

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
    year = serializers.CharField()

    class Meta:
        model = Curriculum
        fields = '__all__'


class SchoolYearSerializer(serializers.ModelSerializer):
    year = serializers.CharField()

    class Meta:
        model = SchoolYear
        fields = '__all__'

    def validate_year(self, value):
        parts = str(value).split('-')
        if len(parts) != 2 or not all(part.isdigit() and len(part) == 4 for part in parts):
            raise serializers.ValidationError('Enter a valid school year like 2026-2027.')

        start_year, end_year = map(int, parts)
        if end_year != start_year + 1:
            raise serializers.ValidationError('School year must span consecutive years.')

        return value


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

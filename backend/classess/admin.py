from django.contrib import admin
from .models import Student, Section, Enrollment, Faculty, FacultyCourseAssignment


# -----------------------
# Faculty Admin
# -----------------------
class FacultyCourseAssignmentInline(admin.TabularInline):
    model = FacultyCourseAssignment
    extra = 1


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'email')
    search_fields = ('name', 'email')
    list_filter = ('department',)
    inlines = [FacultyCourseAssignmentInline]


# -----------------------
# Student Admin
# -----------------------
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        'student_id',
        'first_name',
        'last_name',
        'program',
        'year_level',
    )
    search_fields = (
        'student_id',
        'first_name',
        'last_name',
    )
    list_filter = ('program', 'year_level')


# -----------------------
# Section Admin
# -----------------------
@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'course',
        'faculty',
        'semester',
        'academic_year',
    )
    search_fields = ('name', 'course__code')
    list_filter = ('course', 'faculty', 'semester', 'academic_year')


# -----------------------
# Enrollment Admin
# -----------------------
@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        'student',
        'section',
        'course',
        'enrolled_at',
    )
    search_fields = (
        'student__student_id',
        'student__first_name',
        'student__last_name',
    )
    list_filter = ('course', 'section')

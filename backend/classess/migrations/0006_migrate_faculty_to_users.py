from django.contrib.auth.hashers import make_password
from django.db import migrations


DEFAULT_FACULTY_PASSWORD = "Faculty123!"
DEFAULT_DEPARTMENT = "Computer Engineering"


def split_name(full_name):
    cleaned_name = (full_name or "").strip()
    if not cleaned_name:
        return "", ""

    parts = cleaned_name.split()
    if len(parts) == 1:
        return parts[0], ""
    return " ".join(parts[:-1]), parts[-1]


def migrate_faculty_to_users(apps, schema_editor):
    Faculty = apps.get_model("classess", "Faculty")
    Section = apps.get_model("classess", "Section")
    User = apps.get_model("users", "User")

    user_by_faculty_id = {}

    for faculty in Faculty.objects.all():
        first_name, last_name = split_name(faculty.name)
        defaults = {
            "username": faculty.email,
            "first_name": first_name,
            "last_name": last_name,
            "department": faculty.department or DEFAULT_DEPARTMENT,
            "role": "staff",
            "password": make_password(DEFAULT_FACULTY_PASSWORD),
        }
        user, _ = User.objects.update_or_create(email=faculty.email, defaults=defaults)
        user_by_faculty_id[faculty.id] = user.id

    for section in Section.objects.exclude(assigned_faculty__isnull=True):
        mapped_user_id = user_by_faculty_id.get(section.assigned_faculty_id)
        if mapped_user_id:
            section.faculty_id = mapped_user_id
            section.save(update_fields=["faculty"])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_alter_user_managers"),
        ("classess", "0005_section_academic_year_semester_cleanup"),
    ]

    operations = [
        migrations.RunPython(migrate_faculty_to_users, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="section",
            name="assigned_faculty",
        ),
        migrations.DeleteModel(
            name="FacultyCourseAssignment",
        ),
        migrations.DeleteModel(
            name="Faculty",
        ),
    ]

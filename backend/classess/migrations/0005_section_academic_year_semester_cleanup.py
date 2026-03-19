from django.db import migrations, models


def populate_section_semester(apps, schema_editor):
    Section = apps.get_model("classess", "Section")

    for section in Section.objects.select_related("course").all():
        if not section.semester:
            section.semester = getattr(section.course, "semester", "") or ""
            section.save(update_fields=["semester"])


class Migration(migrations.Migration):

    dependencies = [
        ("classess", "0004_alter_section_unique_together_section_school_year_and_more"),
    ]

    operations = [
        migrations.RenameField(
            model_name="section",
            old_name="school_year",
            new_name="academic_year",
        ),
        migrations.AddField(
            model_name="section",
            name="semester",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.RunPython(populate_section_semester, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="section",
            name="room",
        ),
        migrations.RemoveField(
            model_name="section",
            name="schedule",
        ),
        migrations.RemoveField(
            model_name="section",
            name="schedule_days",
        ),
        migrations.RemoveField(
            model_name="section",
            name="schedule_start",
        ),
        migrations.RemoveField(
            model_name="section",
            name="schedule_end",
        ),
        migrations.AlterUniqueTogether(
            name="section",
            unique_together={("name", "course", "academic_year", "semester")},
        ),
    ]

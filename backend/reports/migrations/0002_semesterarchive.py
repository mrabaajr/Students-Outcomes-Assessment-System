from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0001_initial"),
        ("classess", "0007_section_is_active"),
    ]

    operations = [
        migrations.CreateModel(
            name="SemesterArchive",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("school_year", models.CharField(blank=True, default="", max_length=20)),
                ("semester", models.CharField(blank=True, default="", max_length=100)),
                ("report_type", models.CharField(default="Program Summary", max_length=100)),
                ("status", models.CharField(default="Completed", max_length=50)),
                ("summary", models.TextField(blank=True, default="")),
                ("highlights", models.JSONField(blank=True, default=list)),
                ("generated_by", models.CharField(blank=True, default="", max_length=255)),
                ("file_format", models.CharField(default="Archived Snapshot", max_length=100)),
                ("avg_score", models.FloatField(default=0)),
                ("courses_assessed", models.PositiveIntegerField(default=0)),
                ("students_assessed", models.PositiveIntegerField(default=0)),
                ("sections_archived", models.PositiveIntegerField(default=0)),
                ("snapshot", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at", "-id"]},
        ),
    ]

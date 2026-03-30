from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("courses", "0005_coursesomapping_academic_year"),
        ("classess", "0005_section_academic_year_semester_cleanup"),
        ("so", "0002_alter_performanceindicator_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReportTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("school_year", models.CharField(blank=True, default="", max_length=20)),
                ("formula", models.TextField(default="(got80OrHigher / studentsAnswered) * distribution")),
                ("variables", models.JSONField(blank=True, default=list)),
                ("table_data", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("course", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="report_templates", to="courses.course")),
                ("section", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="report_templates", to="classess.section")),
                ("student_outcome", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="report_templates", to="so.studentoutcome")),
            ],
            options={
                "ordering": ["student_outcome__number", "course__code", "section__name", "school_year"],
            },
        ),
        migrations.AddConstraint(
            model_name="reporttemplate",
            constraint=models.UniqueConstraint(fields=("student_outcome", "course", "section", "school_year"), name="unique_report_template_scope"),
        ),
    ]

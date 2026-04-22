from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("classess", "0007_section_is_active"),
    ]

    operations = [
        migrations.AlterField(
            model_name="section",
            name="faculty",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"role__in": ["admin", "staff"]},
                null=True,
                on_delete=models.SET_NULL,
                related_name="assigned_sections",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]

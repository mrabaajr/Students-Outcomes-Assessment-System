from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assessment", "0002_support_indicator_grades"),
    ]

    operations = [
        migrations.AddField(
            model_name="assessment",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default="2000-01-01T00:00:00Z"),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name="assessment",
            options={"ordering": ["-updated_at", "-created_at"]},
        ),
    ]

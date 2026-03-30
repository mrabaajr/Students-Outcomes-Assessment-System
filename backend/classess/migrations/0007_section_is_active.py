from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("classess", "0006_migrate_faculty_to_users"),
    ]

    operations = [
        migrations.AddField(
            model_name="section",
            name="is_active",
            field=models.BooleanField(db_index=True, default=True),
        ),
    ]

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_auditlog"),
    ]

    operations = [
        migrations.CreateModel(
            name="EmailSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email_host", models.CharField(blank=True, default="", max_length=255)),
                ("email_port", models.PositiveIntegerField(default=587)),
                ("email_use_tls", models.BooleanField(default=True)),
                ("email_host_user", models.CharField(blank=True, default="", max_length=255)),
                ("email_host_password", models.CharField(blank=True, default="", max_length=255)),
                ("default_from_email", models.EmailField(blank=True, default="", max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.SET_NULL,
                        related_name="updated_email_settings",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Email Settings",
                "verbose_name_plural": "Email Settings",
                "ordering": ["-updated_at"],
            },
        ),
    ]

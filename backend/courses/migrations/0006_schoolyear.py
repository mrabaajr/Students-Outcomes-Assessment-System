from django.db import migrations, models


def seed_school_years(apps, schema_editor):
    SchoolYear = apps.get_model('courses', 'SchoolYear')
    for year in ['2023-2024', '2024-2025', '2025-2026', '2026-2027']:
        SchoolYear.objects.get_or_create(year=year)


def unseed_school_years(apps, schema_editor):
    SchoolYear = apps.get_model('courses', 'SchoolYear')
    SchoolYear.objects.filter(year__in=['2023-2024', '2024-2025', '2025-2026', '2026-2027']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0005_coursesomapping_academic_year'),
    ]

    operations = [
        migrations.CreateModel(
            name='SchoolYear',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.CharField(max_length=9, unique=True)),
            ],
            options={
                'verbose_name': 'School Year',
                'verbose_name_plural': 'School Years',
                'ordering': ['year'],
            },
        ),
        migrations.RunPython(seed_school_years, unseed_school_years),
    ]

from django.db import migrations, models


def dedupe_course_so_mappings(apps, schema_editor):
    CourseSOMapping = apps.get_model("courses", "CourseSOMapping")

    duplicate_keys = (
        CourseSOMapping.objects.values("course_id", "curriculum_id", "academic_year", "semester")
        .order_by()
        .annotate(row_count=models.Count("id"))
        .filter(row_count__gt=1)
    )

    for key in duplicate_keys:
        duplicates = list(
            CourseSOMapping.objects.filter(
                course_id=key["course_id"],
                curriculum_id=key["curriculum_id"],
                academic_year=key["academic_year"],
                semester=key["semester"],
            )
            .prefetch_related("mapped_sos")
            .order_by("-updated_at", "-id")
        )

        primary = duplicates[0]
        stale_rows = duplicates[1:]

        merged_so_ids = set(primary.mapped_sos.values_list("id", flat=True))
        for row in stale_rows:
            merged_so_ids.update(row.mapped_sos.values_list("id", flat=True))

        if merged_so_ids:
            primary.mapped_sos.set(merged_so_ids)
        else:
            primary.mapped_sos.clear()

        # Prefer the freshest row's metadata, but backfill any blank fields from duplicates.
        for row in stale_rows:
            for field in ("code", "name", "year_level", "credits", "description"):
                current_value = getattr(primary, field, None)
                other_value = getattr(row, field, None)
                if current_value in (None, "") and other_value not in (None, ""):
                    setattr(primary, field, other_value)

        primary.save()

        stale_ids = [row.id for row in stale_rows]
        if stale_ids:
            CourseSOMapping.objects.filter(id__in=stale_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0007_alter_coursesomapping_academic_year_and_more"),
    ]

    operations = [
        migrations.RunPython(dedupe_course_so_mappings, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="coursesomapping",
            constraint=models.UniqueConstraint(
                fields=("course", "curriculum", "academic_year", "semester"),
                name="unique_course_mapping_per_term",
            ),
        ),
    ]

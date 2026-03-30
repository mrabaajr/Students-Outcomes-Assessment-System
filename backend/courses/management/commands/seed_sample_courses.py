from django.core.management.base import BaseCommand
from django.db import transaction

from courses.models import Course, CourseSOMapping, Curriculum
from so.models import StudentOutcome


SAMPLE_COURSES = [
    {
        "code": "SMP101",
        "name": "Course 1",
        "curriculum": "2018",
        "year_level": "1st Year",
        "semester": "1st Semester",
        "credits": 3,
        "description": "Introductory foundations course focused on analytical thinking and engineering study habits.",
        "academic_year": "2024-2025",
        "mapped_so_numbers": [1, 3],
    },
    {
        "code": "SMP102",
        "name": "Course 2",
        "curriculum": "2018",
        "year_level": "1st Year",
        "semester": "2nd Semester",
        "credits": 4,
        "description": "Problem-solving course emphasizing structured reasoning, documentation, and guided design work.",
        "academic_year": "2024-2025",
        "mapped_so_numbers": [1, 2, 7],
    },
    {
        "code": "SMP201",
        "name": "Course 3",
        "curriculum": "2023",
        "year_level": "2nd Year",
        "semester": "1st Semester",
        "credits": 3,
        "description": "Applied computing course that blends experiments, data handling, and technical communication.",
        "academic_year": "2025-2026",
        "mapped_so_numbers": [3, 6],
    },
    {
        "code": "SMP202",
        "name": "Course 4",
        "curriculum": "2023",
        "year_level": "2nd Year",
        "semester": "2nd Semester",
        "credits": 3,
        "description": "Collaborative laboratory-style course centered on teamwork, design iteration, and reporting.",
        "academic_year": "2025-2026",
        "mapped_so_numbers": [2, 3, 5],
    },
    {
        "code": "SMP203",
        "name": "Course 5",
        "curriculum": "2023",
        "year_level": "2nd Year",
        "semester": "Summer",
        "credits": 2,
        "description": "Short-format enrichment course exploring emerging tools, self-directed learning, and adaptability.",
        "academic_year": "2025-2026",
        "mapped_so_numbers": [6, 7],
    },
    {
        "code": "SMP301",
        "name": "Course 6",
        "curriculum": "2025",
        "year_level": "3rd Year",
        "semester": "1st Semester",
        "credits": 4,
        "description": "Systems-oriented course with deeper emphasis on design constraints, standards, and evaluation.",
        "academic_year": "2024-2025",
        "mapped_so_numbers": [2, 4, 6],
    },
    {
        "code": "SMP302",
        "name": "Course 7",
        "curriculum": "2025",
        "year_level": "3rd Year",
        "semester": "2nd Semester",
        "credits": 3,
        "description": "Integration course combining technical writing, presentations, and engineering judgment tasks.",
        "academic_year": "2024-2025",
        "mapped_so_numbers": [3, 4, 6],
    },
    {
        "code": "SMP401",
        "name": "Course 8",
        "curriculum": "2018",
        "year_level": "4th Year",
        "semester": "1st Semester",
        "credits": 5,
        "description": "Capstone-preparation course built around planning, leadership, and multidisciplinary coordination.",
        "academic_year": "2023-2024",
        "mapped_so_numbers": [2, 5, 7],
    },
    {
        "code": "SMP402",
        "name": "Course 9",
        "curriculum": "2023",
        "year_level": "4th Year",
        "semester": "2nd Semester",
        "credits": 4,
        "description": "Advanced project course focused on ethical decisions, sustainability, and stakeholder-aware solutions.",
        "academic_year": "2023-2024",
        "mapped_so_numbers": [4, 5],
    },
    {
        "code": "SMP403",
        "name": "Course 10",
        "curriculum": "2025",
        "year_level": "4th Year",
        "semester": "Summer",
        "credits": 3,
        "description": "Special topics course that highlights independent learning, innovation, and rapid technical adaptation.",
        "academic_year": "2025-2026",
        "mapped_so_numbers": [1, 6, 7],
    },
]


class Command(BaseCommand):
    help = "Seed 10 varied sample courses and course-to-SO mappings for the Courses page."

    @transaction.atomic
    def handle(self, *args, **options):
        curricula = {curr.year: curr for curr in Curriculum.objects.all()}
        missing_curricula = sorted({item["curriculum"] for item in SAMPLE_COURSES} - set(curricula.keys()))
        if missing_curricula:
            self.stderr.write(
                self.style.ERROR(
                    f"Missing curriculum records for: {', '.join(missing_curricula)}"
                )
            )
            return

        student_outcomes = {so.number: so for so in StudentOutcome.objects.all()}
        missing_sos = sorted(
            {
                so_number
                for item in SAMPLE_COURSES
                for so_number in item["mapped_so_numbers"]
                if so_number not in student_outcomes
            }
        )
        if missing_sos:
            self.stderr.write(
                self.style.ERROR(
                    f"Missing student outcomes for SO numbers: {', '.join(map(str, missing_sos))}"
                )
            )
            return

        for item in SAMPLE_COURSES:
            curriculum = curricula[item["curriculum"]]

            course, _ = Course.objects.update_or_create(
                code=item["code"],
                defaults={
                    "name": item["name"],
                    "curriculum": curriculum,
                    "year_level": item["year_level"],
                    "semester": item["semester"],
                    "credits": item["credits"],
                    "description": item["description"],
                },
            )

            mapping, _ = CourseSOMapping.objects.update_or_create(
                code=item["code"],
                academic_year=item["academic_year"],
                defaults={
                    "course": course,
                    "name": item["name"],
                    "curriculum": curriculum,
                    "year_level": item["year_level"],
                    "semester": item["semester"],
                    "credits": item["credits"],
                    "description": item["description"],
                },
            )

            mapping.mapped_sos.set(
                [student_outcomes[so_number] for so_number in item["mapped_so_numbers"]]
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded or updated {len(SAMPLE_COURSES)} sample courses for the Courses page."
            )
        )

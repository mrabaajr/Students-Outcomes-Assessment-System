from django.core.management.base import BaseCommand
from django.db import transaction

from classess.models import Enrollment, Faculty, FacultyCourseAssignment, Section, Student
from courses.models import Course


SAMPLE_FACULTY = [
    {
        "name": "Ariana Mendoza",
        "department": "Computer Engineering",
        "email": "ariana.mendoza@example.edu",
    },
    {
        "name": "Caleb Navarro",
        "department": "Computer Engineering",
        "email": "caleb.navarro@example.edu",
    },
]


SAMPLE_SECTIONS = [
    {
        "name": "C1A",
        "course_code": "SMP101",
        "course_name": "Course 1",
        "academic_year": "2024-2025",
        "semester": "1st Semester",
        "faculty_email": "ariana.mendoza@example.edu",
        "students": [
            ("2026-10001", "Liam", "Castro", "BSCPE", 1),
            ("2026-10002", "Nina", "Flores", "BSCPE", 1),
            ("2026-10003", "Ethan", "Ramos", "BSCPE", 1),
            ("2026-10004", "Paula", "Reyes", "BSCPE", 1),
            ("2026-10005", "Marco", "Santos", "BSCPE", 1),
        ],
    },
    {
        "name": "C2A",
        "course_code": "SMP102",
        "course_name": "Course 2",
        "academic_year": "2024-2025",
        "semester": "2nd Semester",
        "faculty_email": "caleb.navarro@example.edu",
        "students": [
            ("2026-10006", "Ivy", "Gomez", "BSCPE", 1),
            ("2026-10007", "Noah", "Aquino", "BSCPE", 1),
            ("2026-10008", "Janelle", "Tan", "BSCPE", 1),
            ("2026-10009", "Kyle", "Torres", "BSCPE", 1),
            ("2026-10010", "Mia", "Villanueva", "BSCPE", 1),
        ],
    },
    {
        "name": "C3A",
        "course_code": "SMP201",
        "course_name": "Course 3",
        "academic_year": "2025-2026",
        "semester": "1st Semester",
        "faculty_email": "ariana.mendoza@example.edu",
        "students": [
            ("2025-20001", "Jared", "Luna", "BSCPE", 2),
            ("2025-20002", "Bianca", "Morales", "BSCPE", 2),
            ("2025-20003", "Andre", "Pineda", "BSCPE", 2),
            ("2025-20004", "Chloe", "Garcia", "BSCPE", 2),
            ("2025-20005", "Ralph", "Diaz", "BSCPE", 2),
        ],
    },
    {
        "name": "C4A",
        "course_code": "SMP202",
        "course_name": "Course 4",
        "academic_year": "2025-2026",
        "semester": "2nd Semester",
        "faculty_email": "caleb.navarro@example.edu",
        "students": [
            ("2025-20006", "Sofia", "Uy", "BSCPE", 2),
            ("2025-20007", "Nathan", "Bautista", "BSCPE", 2),
            ("2025-20008", "Alyssa", "Molina", "BSCPE", 2),
            ("2025-20009", "Harvey", "Lopez", "BSCPE", 2),
            ("2025-20010", "Trina", "David", "BSCPE", 2),
        ],
    },
    {
        "name": "C5A",
        "course_code": "SMP203",
        "course_name": "Course 5",
        "academic_year": "2025-2026",
        "semester": "Summer",
        "faculty_email": "ariana.mendoza@example.edu",
        "students": [
            ("2025-20011", "Cedric", "Gutierrez", "BSCPE", 2),
            ("2025-20012", "Lea", "Valdez", "BSCPE", 2),
            ("2025-20013", "Bryan", "Cruz", "BSCPE", 2),
            ("2025-20014", "Denise", "Navarro", "BSCPE", 2),
            ("2025-20015", "Owen", "Salazar", "BSCPE", 2),
        ],
    },
    {
        "name": "C6A",
        "course_code": "SMP301",
        "course_name": "Course 6",
        "academic_year": "2024-2025",
        "semester": "1st Semester",
        "faculty_email": "caleb.navarro@example.edu",
        "students": [
            ("2024-30001", "Faith", "Alonzo", "BSCPE", 3),
            ("2024-30002", "Sean", "Campos", "BSCPE", 3),
            ("2024-30003", "Gwen", "Dela Cruz", "BSCPE", 3),
            ("2024-30004", "Ivan", "Rosales", "BSCPE", 3),
            ("2024-30005", "Kate", "Serrano", "BSCPE", 3),
        ],
    },
    {
        "name": "C7A",
        "course_code": "SMP302",
        "course_name": "Course 7",
        "academic_year": "2024-2025",
        "semester": "2nd Semester",
        "faculty_email": "ariana.mendoza@example.edu",
        "students": [
            ("2024-30006", "Lance", "Manalo", "BSCPE", 3),
            ("2024-30007", "Reese", "Cortez", "BSCPE", 3),
            ("2024-30008", "Troy", "Jimenez", "BSCPE", 3),
            ("2024-30009", "Ella", "Natividad", "BSCPE", 3),
            ("2024-30010", "Miguel", "Padilla", "BSCPE", 3),
        ],
    },
    {
        "name": "C8A",
        "course_code": "SMP401",
        "course_name": "Course 8",
        "academic_year": "2023-2024",
        "semester": "1st Semester",
        "faculty_email": "caleb.navarro@example.edu",
        "students": [
            ("2023-40001", "Clarisse", "Yap", "BSCPE", 4),
            ("2023-40002", "Adrian", "Miranda", "BSCPE", 4),
            ("2023-40003", "Jessa", "Castillo", "BSCPE", 4),
            ("2023-40004", "Paolo", "Herrera", "BSCPE", 4),
            ("2023-40005", "Sam", "Evangelista", "BSCPE", 4),
        ],
    },
    {
        "name": "C9A",
        "course_code": "SMP402",
        "course_name": "Course 9",
        "academic_year": "2023-2024",
        "semester": "2nd Semester",
        "faculty_email": "ariana.mendoza@example.edu",
        "students": [
            ("2023-40006", "Trisha", "Legaspi", "BSCPE", 4),
            ("2023-40007", "Enzo", "Mendoza", "BSCPE", 4),
            ("2023-40008", "Katrina", "Velasco", "BSCPE", 4),
            ("2023-40009", "Louis", "Ferrer", "BSCPE", 4),
            ("2023-40010", "Celine", "Rivera", "BSCPE", 4),
        ],
    },
    {
        "name": "C10A",
        "course_code": "SMP403",
        "course_name": "Course 10",
        "academic_year": "2025-2026",
        "semester": "Summer",
        "faculty_email": "caleb.navarro@example.edu",
        "students": [
            ("2023-40011", "Joaquin", "Ocampo", "BSCPE", 4),
            ("2023-40012", "Nicole", "Abad", "BSCPE", 4),
            ("2023-40013", "Vince", "Perez", "BSCPE", 4),
            ("2023-40014", "Mae", "Soriano", "BSCPE", 4),
            ("2023-40015", "Dylan", "Chua", "BSCPE", 4),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed sample sections, faculty, and students for the Classes page."

    @transaction.atomic
    def handle(self, *args, **options):
        faculty_by_email = {}
        for faculty_data in SAMPLE_FACULTY:
            faculty, _ = Faculty.objects.update_or_create(
                email=faculty_data["email"],
                defaults={
                    "name": faculty_data["name"],
                    "department": faculty_data["department"],
                },
            )
            faculty_by_email[faculty.email] = faculty

        assignment_map = {}
        kept_section_ids = set()

        for section_data in SAMPLE_SECTIONS:
            course = Course.objects.filter(code=section_data["course_code"]).first()
            if not course:
                self.stderr.write(
                    self.style.ERROR(
                        f"Course {section_data['course_code']} does not exist. Seed sample courses first."
                    )
                )
                return

            assigned_faculty = faculty_by_email[section_data["faculty_email"]]
            section, _ = Section.objects.update_or_create(
                name=section_data["name"],
                course=course,
                academic_year=section_data["academic_year"],
                semester=section_data["semester"],
                defaults={
                    "assigned_faculty": assigned_faculty,
                },
            )
            kept_section_ids.add(section.id)

            assignment_key = (assigned_faculty.id, course.code)
            assignment_entry = assignment_map.setdefault(
                assignment_key,
                {
                    "faculty": assigned_faculty,
                    "course_code": course.code,
                    "course_name": course.name,
                    "sections": set(),
                },
            )
            assignment_entry["sections"].add(section.name)

            kept_enrollment_ids = set()
            for student_id, first_name, last_name, program, year_level in section_data["students"]:
                student, _ = Student.objects.update_or_create(
                    student_id=student_id,
                    defaults={
                        "first_name": first_name,
                        "last_name": last_name,
                        "program": program,
                        "year_level": year_level,
                    },
                )

                enrollment, _ = Enrollment.objects.update_or_create(
                    student=student,
                    course=course,
                    defaults={"section": section},
                )
                kept_enrollment_ids.add(enrollment.id)

            Enrollment.objects.filter(section=section).exclude(id__in=kept_enrollment_ids).delete()

        kept_assignment_ids = set()
        for assignment_data in assignment_map.values():
            assignment, _ = FacultyCourseAssignment.objects.update_or_create(
                faculty=assignment_data["faculty"],
                course_code=assignment_data["course_code"],
                defaults={"course_name": assignment_data["course_name"]},
            )
            assignment.set_sections_list(sorted(assignment_data["sections"]))
            assignment.save()
            kept_assignment_ids.add(assignment.id)

        FacultyCourseAssignment.objects.filter(
            faculty__email__in=[faculty["email"] for faculty in SAMPLE_FACULTY]
        ).exclude(id__in=kept_assignment_ids).delete()

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded 10 sample sections, 2 sample faculty members, and 5 students per section."
            )
        )

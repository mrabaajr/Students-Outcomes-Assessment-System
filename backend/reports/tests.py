from django.test import TestCase
from rest_framework.test import APIClient

from assessment.models import Assessment, Grade
from classess.models import Enrollment, Section, Student
from courses.models import Course, CourseSOMapping, Curriculum
from so.models import PerformanceCriterion, PerformanceIndicator, StudentOutcome
from .models import ReportTemplate


class ReportsDashboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.curriculum = Curriculum.objects.create(year="2023")
        self.course = Course.objects.create(
            code="CPE101",
            name="Intro to Computing",
            curriculum=self.curriculum,
            year_level="1st Year",
            semester="1st Semester",
            credits=3,
        )
        self.section = Section.objects.create(
            name="CPE11S1",
            course=self.course,
            academic_year="2025-2026",
            semester="1st Semester",
        )
        self.student = Student.objects.create(
            student_id="2025-0001",
            first_name="Ada",
            last_name="Lovelace",
            program="Computer Engineering",
            year_level=1,
        )
        Enrollment.objects.create(student=self.student, section=self.section, course=self.course)

        self.student_outcome = StudentOutcome.objects.create(
            number=1,
            title="Apply Engineering Knowledge",
            description="Use engineering fundamentals in practice.",
        )
        self.indicator = PerformanceIndicator.objects.create(
            student_outcome=self.student_outcome,
            number=1,
            description="Solve foundational engineering problems.",
        )

        self.assessment = Assessment.objects.create(
            section=self.section,
            student_outcome=self.student_outcome,
            school_year="2025-2026",
        )
        Grade.objects.create(
            assessment=self.assessment,
            student=self.student,
            performance_indicator=self.indicator,
            score=5,
        )
        self.mapping = CourseSOMapping.objects.create(
            course=self.course,
            code=self.course.code,
            name=self.course.name,
            curriculum=self.curriculum,
            year_level=self.course.year_level,
            semester=self.course.semester,
            credits=self.course.credits,
            description=self.course.description,
            academic_year="2025-2026",
        )
        self.mapping.mapped_sos.add(self.student_outcome)

    def test_dashboard_returns_assessment_summary(self):
        response = self.client.get(
            "/api/reports/dashboard/",
            {"school_year": "2025-2026", "course": self.course.id, "section": self.section.id},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["metrics"]["total_student_outcomes"], 1)
        self.assertEqual(len(payload["so_summary_tables"]), 1)
        self.assertEqual(payload["so_summary_tables"][0]["so_id"], self.student_outcome.id)

    def test_save_summary_table_persists_custom_report_config(self):
        response = self.client.post(
            "/api/reports/save_summary_table/",
            {
                "so_id": self.student_outcome.id,
                "school_year": "2025-2026",
                "course_id": self.course.id,
                "section_id": self.section.id,
                "formula": "(got80OrHigher / studentsAnswered) * distribution * bonus",
                "variables": [
                    {"key": "distribution", "label": "Distribution (i)"},
                    {"key": "studentsAnswered", "label": "Students Answered"},
                    {"key": "got80OrHigher", "label": "Got 80% or Higher"},
                    {"key": "bonus", "label": "Bonus"},
                ],
                "table_data": {
                    "so_id": self.student_outcome.id,
                    "so_number": 1,
                    "program": "Computer Engineering",
                    "source_assessment": "CPE101",
                    "time_of_data_collection": "2025-2026",
                    "courses": [],
                    "totals": {"target_level": 80},
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        template = ReportTemplate.objects.get(
            student_outcome=self.student_outcome,
            course=self.course,
            section=self.section,
            school_year="2025-2026",
        )
        self.assertIn("bonus", template.formula)
        self.assertEqual(template.table_data["program"], "Computer Engineering")

    def test_dashboard_excludes_courses_not_mapped_to_the_so(self):
        other_so = StudentOutcome.objects.create(
            number=2,
            title="Communicate Effectively",
            description="Present engineering ideas clearly.",
        )
        other_indicator = PerformanceIndicator.objects.create(
            student_outcome=other_so,
            number=1,
            description="Communicate designs and decisions clearly.",
        )
        rogue_assessment = Assessment.objects.create(
            section=self.section,
            student_outcome=other_so,
            school_year="2025-2026",
        )
        Grade.objects.create(
            assessment=rogue_assessment,
            student=self.student,
            performance_indicator=other_indicator,
            score=5,
        )

        response = self.client.get("/api/reports/dashboard/", {"school_year": "2025-2026"})
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        so_numbers = [table["so_number"] for table in payload["so_summary_tables"]]
        self.assertEqual(so_numbers, [1])

    def test_dashboard_uses_fallback_course_mapping_when_year_specific_mapping_is_missing(self):
        Assessment.objects.filter(id=self.assessment.id).update(school_year="2026-2027")

        rogue_so = StudentOutcome.objects.create(
            number=3,
            title="Use Modern Tools",
            description="Use appropriate modern engineering tools.",
        )
        rogue_indicator = PerformanceIndicator.objects.create(
            student_outcome=rogue_so,
            number=1,
            description="Use modern tools effectively.",
        )
        rogue_assessment = Assessment.objects.create(
            section=self.section,
            student_outcome=rogue_so,
            school_year="2026-2027",
        )
        Grade.objects.create(
            assessment=rogue_assessment,
            student=self.student,
            performance_indicator=rogue_indicator,
            score=5,
        )

        response = self.client.get("/api/reports/dashboard/", {"school_year": "2026-2027"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        so_numbers = [table["so_number"] for table in payload["so_summary_tables"]]
        self.assertEqual(so_numbers, [1])

    def test_dashboard_merges_saved_template_without_reintroducing_removed_courses(self):
        other_course = Course.objects.create(
            code="CPE202",
            name="Another Course",
            curriculum=self.curriculum,
            year_level="1st Year",
            semester="1st Semester",
            credits=3,
        )
        ReportTemplate.objects.create(
            student_outcome=self.student_outcome,
            school_year="2025-2026",
            formula="(got80OrHigher / studentsAnswered) * distribution",
            variables=[
                {"key": "distribution", "label": "Distribution (i)"},
                {"key": "studentsAnswered", "label": "Students Answered"},
                {"key": "got80OrHigher", "label": "Got 80% or Higher"},
            ],
            table_data={
                "program": "Computer Engineering",
                "source_assessment": "Old Source",
                "time_of_data_collection": "2025-2026",
                "courses": [
                    {
                        "course_id": other_course.id,
                        "course_code": other_course.code,
                        "course_name": other_course.name,
                        "indicators": [],
                    }
                ],
                "totals": {"target_level": 80, "conclusion": "Old conclusion"},
            },
        )

        response = self.client.get("/api/reports/dashboard/", {"school_year": "2025-2026"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        courses = payload["so_summary_tables"][0]["courses"]
        self.assertEqual([course["course_code"] for course in courses], ["CPE101"])

    def test_dashboard_expands_indicator_criteria_into_separate_report_rows(self):
        Grade.objects.filter(assessment=self.assessment).delete()
        criterion_one = PerformanceCriterion.objects.create(
            performance_indicator=self.indicator,
            name="Criterion 1",
            order=1,
        )
        criterion_two = PerformanceCriterion.objects.create(
            performance_indicator=self.indicator,
            name="Criterion 2",
            order=2,
        )
        Grade.objects.create(
            assessment=self.assessment,
            student=self.student,
            criterion=criterion_one,
            score=5,
        )
        Grade.objects.create(
            assessment=self.assessment,
            student=self.student,
            criterion=criterion_two,
            score=6,
        )

        response = self.client.get(
            "/api/reports/dashboard/",
            {"school_year": "2025-2026", "course": self.course.id, "section": self.section.id},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        indicators = payload["so_summary_tables"][0]["courses"][0]["indicators"]

        self.assertEqual([row["indicator_label"] for row in indicators], ["P1.1", "P1.2"])
        self.assertEqual([row["distribution"] for row in indicators], [0.5, 0.5])
        self.assertEqual([row["answered_count"] for row in indicators], [1, 1])
        self.assertEqual([row["satisfactory_count"] for row in indicators], [1, 1])

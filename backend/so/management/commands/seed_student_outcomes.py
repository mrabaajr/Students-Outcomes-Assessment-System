from django.core.management.base import BaseCommand
from django.db import transaction

from so.models import PerformanceCriterion, PerformanceIndicator, StudentOutcome


SO_DATA = [
    {
        "number": 1,
        "title": "T.I.P. SO 1",
        "description": (
            "identify, formulate, and solve complex engineering problems by applying "
            "knowledge and principles of engineering, science, and mathematics"
        ),
        "indicators": [
            {
                "number": 1,
                "description": (
                    "identify complex engineering problems by applying knowledge and "
                    "principles of engineering, science, and mathematics"
                ),
                "criteria": [],
            },
            {
                "number": 2,
                "description": (
                    "formulate engineering solutions in solving complex engineering problems "
                    "by applying knowledge and principles of engineering, science, and mathematics"
                ),
                "criteria": [],
            },
            {
                "number": 3,
                "description": (
                    "solve complex engineering problems by applying knowledge and principles "
                    "of engineering, science, and mathematics."
                ),
                "criteria": [
                    "Approaches in solving complex engineering problems.",
                    (
                        "Application of appropriate mathematical, science, and engineering "
                        "principles in solving complex engineering problems"
                    ),
                ],
            },
        ],
    },
    {
        "number": 2,
        "title": "T.I.P. SO 2",
        "description": (
            "apply engineering design to produce solutions that meet specified needs with "
            "consideration of public health, safety, welfare, global, cultural, social, "
            "environmental, and economic factors."
        ),
        "indicators": [
            {
                "number": 1,
                "description": "Identify a problem and formulate engineering solutions and/or satisfy a need",
                "criteria": [],
            },
            {
                "number": 2,
                "description": "Use trade-offs to determine final design choice",
                "criteria": [],
            },
            {
                "number": 3,
                "description": (
                    "solve complex engineering problems by applying knowledge and principles "
                    "of engineering, science, and mathematics."
                ),
                "criteria": [],
            },
            {
                "number": 4,
                "description": "Apply appropriate standards and codes in the design process",
                "criteria": [],
            },
        ],
    },
    {
        "number": 3,
        "title": "T.I.P. SO 3",
        "description": (
            "communicate effectively on complex engineering activities with various communities "
            "including engineering experts and society at large using appropriate levels of discourse."
        ),
        "indicators": [
            {
                "number": 1,
                "description": (
                    "Ability to communicate effectively and inclusively on complex engineering "
                    "activities with a range of audiences by being able to comprehend in a variety "
                    "of ways considering cultural, language, and learning differences"
                ),
                "criteria": [
                    "Comprehension on complex engineering activities",
                ],
            },
            {
                "number": 2,
                "description": (
                    "Ability to communicate effectively and inclusively on complex engineering "
                    "activities with a range of audiences by being able to write in a variety of "
                    "ways considering cultural, language, and learning differences"
                ),
                "criteria": [
                    "Problem Statement or purpose",
                    "Expression of ideas",
                    "Illustrations to support the core messages",
                    "Conclusion and summary",
                    "List of references",
                ],
            },
            {
                "number": 3,
                "description": (
                    "Ability to communicate effectively and inclusively on complex engineering "
                    "activities with a range of audiences by being able to present in a variety of "
                    "ways considering cultural, language, and learning differences"
                ),
                "criteria": [
                    "Confidence in presenting the topic",
                    "Coherence and consistency",
                    "Energy and enthusiasm",
                ],
            },
        ],
    },
    {
        "number": 4,
        "title": "T.I.P. SO 4",
        "description": (
            "recognize ethical and professional responsibilities in engineering situations and "
            "make informed judgments, which must consider the impact of engineering solutions in "
            "global, economic, environmental, and societal contexts."
        ),
        "indicators": [
            {
                "number": 1,
                "description": (
                    "An ability to apply principles of ethics and commit to professional ethics, "
                    "technology ethics, data ethics, global responsibilities, and norms of engineering "
                    "practice; and adhere to relevant national and international laws"
                ),
                "criteria": [
                    "Apply principles of ethics and comply with professional Ethics, Technology Ethics and Data Ethics.",
                    "Adopt global responsibilities and norms of engineering practice",
                    "Adhere to relevant national and international laws",
                ],
            },
            {
                "number": 2,
                "description": "An ability to comprehend the need for diversity and inclusion",
                "criteria": [],
            },
            {
                "number": 3,
                "description": (
                    "An ability to recognize ethical and professional responsibilities in engineering "
                    "situations and make informed judgments which must consider the sustainability "
                    "impact of engineering solutions in human, cultural, global, economic, environmental, "
                    "and societal contexts"
                ),
                "criteria": [
                    "ability to recognize ethical and professional responsibilities in engineering situations",
                    (
                        "ability to make informed judgments which must consider the sustainability "
                        "impact of engineering solutions in human, cultural, global, economic, "
                        "environmental, and societal contexts"
                    ),
                ],
            },
        ],
    },
    {
        "number": 5,
        "title": "T.I.P. SO 5",
        "description": (
            "function effectively as an individual member in diverse and inclusive teams and/or "
            "leader who provide leadership, create a collaborative and inclusive environment, establish "
            "goals, plan tasks, and meet objectives in multi-disciplinary and long-distance settings by "
            "applying knowledge of engineering and management principles"
        ),
        "indicators": [
            {
                "number": 1,
                "description": (
                    "Ability to function effectively as an individual member in diverse and inclusive "
                    "teams and/or leader who provide leadership"
                ),
                "criteria": [],
            },
            {
                "number": 2,
                "description": "Ability to create a collaborative and inclusive environment",
                "criteria": [],
            },
            {
                "number": 3,
                "description": (
                    "Ability to establish goals, plan tasks, and meet objectives in multi-disciplinary, "
                    "multicultural, and long-distance setting by applying knowledge of engineering and "
                    "management principles"
                ),
                "criteria": [],
            },
        ],
    },
    {
        "number": 6,
        "title": "T.I.P. SO 6",
        "description": (
            "develop and conduct appropriate experimentation, analyze and interpret data, and use "
            "engineering judgment to draw conclusions"
        ),
        "indicators": [
            {"number": 1, "description": "Develop appropriate experimentation", "criteria": []},
            {"number": 2, "description": "Conduct appropriate experimentation", "criteria": []},
            {"number": 3, "description": "Ability to analyze and interpret data", "criteria": []},
            {"number": 4, "description": "Use of engineering judgment to draw conclusions", "criteria": []},
        ],
    },
    {
        "number": 7,
        "title": "T.I.P. SO 7",
        "description": (
            "acquire and apply new knowledge as needed, using appropriate learning strategies to "
            "engage in independent and life-long learning, creativity and adaptability to new and "
            "emerging technologies, and critical thinking in the broadest context of technological change."
        ),
        "indicators": [
            {"number": 1, "description": "Acquire and apply new knowledge from outside sources", "criteria": []},
            {"number": 2, "description": "Learn independently", "criteria": []},
            {
                "number": 3,
                "description": "Critical thinking in the broadest context of technological change",
                "criteria": [],
            },
            {
                "number": 4,
                "description": "Creativity and adaptability to new and emerging technologies",
                "criteria": [],
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the database with the provided Student Outcomes, Performance Indicators, and Criteria."

    @transaction.atomic
    def handle(self, *args, **options):
        kept_so_ids = []

        for so_data in SO_DATA:
            so_obj, _ = StudentOutcome.objects.update_or_create(
                number=so_data["number"],
                defaults={
                    "title": so_data["title"],
                    "description": so_data["description"],
                },
            )
            kept_so_ids.append(so_obj.id)

            kept_pi_ids = []
            for indicator_data in so_data["indicators"]:
                pi_obj, _ = PerformanceIndicator.objects.update_or_create(
                    student_outcome=so_obj,
                    number=indicator_data["number"],
                    defaults={"description": indicator_data["description"]},
                )
                kept_pi_ids.append(pi_obj.id)

                kept_pc_ids = []
                for order, criterion_name in enumerate(indicator_data["criteria"], start=1):
                    pc_obj, _ = PerformanceCriterion.objects.update_or_create(
                        performance_indicator=pi_obj,
                        order=order,
                        defaults={"name": criterion_name},
                    )
                    kept_pc_ids.append(pc_obj.id)

                PerformanceCriterion.objects.filter(
                    performance_indicator=pi_obj
                ).exclude(id__in=kept_pc_ids).delete()

            PerformanceIndicator.objects.filter(student_outcome=so_obj).exclude(
                id__in=kept_pi_ids
            ).delete()

        StudentOutcome.objects.exclude(id__in=kept_so_ids).delete()

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(SO_DATA)} student outcomes with their performance indicators and criteria."
            )
        )

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from so.models import StudentOutcome, PerformanceIndicator, PerformanceCriterion

# Clear existing data
print("Clearing existing student outcomes...")
StudentOutcome.objects.all().delete()

# Sample data
outcomes_data = [
    {
        "number": 1,
        "title": "T.I.P. SO 1",
        "description": "identify, formulate, and solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics",
        "indicators": [
            {
                "number": 1,
                "description": "identify complex engineering problems by applying knowledge and principles of engineering, science, and mathematics",
                "criteria": []
            },
            {
                "number": 2,
                "description": "formulate engineering solutions in solving complex engineering problems by applying knowledge and principles of engineering, science, and mathematics",
                "criteria": []
            },
            {
                "number": 3,
                "description": "solve complex engineering problems by applying knowledge and principles of engineering, science, and mathematics.",
                "criteria": [
                    {"name": "Approaches in solving complex engineering problems.", "order": 1},
                    {"name": "Application of appropriate mathematical, science, and engineering principles in solving complex engineering problems", "order": 2}
                ]
            }
        ]
    },
    {
        "number": 2,
        "title": "T.I.P. SO 2",
        "description": "apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, welfare, global, cultural, social, environmental, and economic factors.",
        "indicators": [
            {
                "number": 1,
                "description": "Identify a problem and formulate engineering solutions and/or satisfy a need",
                "criteria": []
            },
            {
                "number": 2,
                "description": "Use trade-offs to determine final design choice",
                "criteria": []
            }
        ]
    },
    {
        "number": 3,
        "title": "T.I.P. SO 3",
        "description": "communicate effectively on complex engineering activities with various communities including engineering experts and society at large using appropriate levels of discourse.",
        "indicators": [
            {
                "number": 1,
                "description": "Ability to communicate effectively and inclusively on complex engineering activities",
                "criteria": [
                    {"name": "Comprehension on complex engineering activities", "order": 1}
                ]
            }
        ]
    }
]

# Create student outcomes
created_count = 0
for so_data in outcomes_data:
    so = StudentOutcome.objects.create(
        number=so_data["number"],
        title=so_data["title"],
        description=so_data["description"]
    )
    
    for pi_data in so_data.get("indicators", []):
        pi = PerformanceIndicator.objects.create(
            student_outcome=so,
            number=pi_data["number"],
            description=pi_data["description"]
        )
        
        for pc_data in pi_data.get("criteria", []):
            PerformanceCriterion.objects.create(
                performance_indicator=pi,
                name=pc_data["name"],
                order=pc_data.get("order", 1)
            )
    
    created_count += 1
    print(f"  Created: {so.title}")

print(f"\nSuccessfully created {created_count} student outcomes")
print(f"Total student outcomes in database: {StudentOutcome.objects.count()}")

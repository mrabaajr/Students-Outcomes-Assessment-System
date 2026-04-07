from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.http import HttpResponse
import csv
from io import StringIO
from collections import defaultdict

from .models import Assessment, Grade
from .serializers import AssessmentSerializer
from classess.models import Section, Student
from so.models import StudentOutcome, PerformanceCriterion, PerformanceIndicator


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.prefetch_related('grades').all()
    serializer_class = AssessmentSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    @action(detail=False, methods=['get'], url_path='load_grades')
    def load_grades(self, request):
        """Load grades for a specific section + SO + school_year."""
        section_id = request.query_params.get('section_id')
        so_id = request.query_params.get('so_id')
        school_year = request.query_params.get('school_year', '')

        if not section_id or not so_id:
            return Response({'detail': 'section_id and so_id are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            assessment = Assessment.objects.get(
                section_id=section_id,
                student_outcome_id=so_id,
                school_year=school_year,
            )
        except Assessment.DoesNotExist:
            return Response({'grades': {}})

        grades_payload = {}
        for grade in assessment.grades.all():
            student_key = str(grade.student_id)
            if student_key not in grades_payload:
                grades_payload[student_key] = {}
            if grade.criterion_id:
                grades_payload[student_key][f"criterion:{grade.criterion_id}"] = grade.score
            elif grade.performance_indicator_id:
                grades_payload[student_key][f"indicator:{grade.performance_indicator_id}"] = grade.score

        return Response({'grades': grades_payload})

    @action(detail=False, methods=['post'], url_path='save_grades')
    def save_grades(self, request):
        """Save all grades for a section + SO + school_year."""
        section_id = request.data.get('section_id')
        so_id = request.data.get('so_id')
        school_year = request.data.get('school_year', '')
        grades_data = request.data.get('grades', {})

        print(f"[SAVE GRADES] Received: section_id={section_id}, so_id={so_id}, school_year={school_year}")
        print(f"[SAVE GRADES] Grades data: {grades_data}")

        if not section_id or not so_id:
            return Response({'detail': 'section_id and so_id are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                print(f"[SAVE GRADES] Creating/updating assessment...")
                assessment, created = Assessment.objects.update_or_create(
                    section_id=section_id,
                    student_outcome_id=so_id,
                    school_year=school_year,
                )
                if not created:
                    assessment.save(update_fields=["updated_at"])
                print(f"[SAVE GRADES] Assessment created={created}, id={assessment.id}")

                # Clear existing grades for this assessment
                deleted_count, _ = Grade.objects.filter(assessment=assessment).delete()
                print(f"[SAVE GRADES] Deleted {deleted_count} existing grades")

                # Save new grades
                created_count = 0
                for student_id_str, criteria_grades in grades_data.items():
                    for basis_id_str, score in criteria_grades.items():
                        if score is not None:
                            try:
                                student_id = int(student_id_str)
                                score_val = int(score)
                                if isinstance(basis_id_str, str) and basis_id_str.startswith("indicator:"):
                                    indicator_id = int(basis_id_str.split(":", 1)[1])
                                    print(f"[SAVE GRADES] Creating indicator grade: student={student_id}, indicator={indicator_id}, score={score_val}")
                                    Grade.objects.create(
                                        assessment=assessment,
                                        student_id=student_id,
                                        performance_indicator_id=indicator_id,
                                        score=score_val,
                                    )
                                else:
                                    criterion_id = int(str(basis_id_str).split(":", 1)[-1])
                                    print(f"[SAVE GRADES] Creating criterion grade: student={student_id}, criterion={criterion_id}, score={score_val}")
                                    Grade.objects.create(
                                        assessment=assessment,
                                        student_id=student_id,
                                        criterion_id=criterion_id,
                                        score=score_val,
                                    )
                                created_count += 1
                            except ValueError as ve:
                                print(f"[SAVE GRADES] ValueError converting values: {ve}")
                                raise
                            except Exception as ge:
                                print(f"[SAVE GRADES] Error creating grade for student={student_id_str}, basis={basis_id_str}: {ge}")
                                raise

                print(f"[SAVE GRADES] Successfully saved {created_count} grades")
                return Response({'success': True, 'message': 'Grades saved successfully', 'grades_saved': created_count})
        except Exception as e:
            import traceback
            error_msg = str(e)
            traceback.print_exc()
            print(f"[SAVE GRADES] ERROR: {error_msg}")
            return Response(
                {'detail': f'Error saving grades: {error_msg}', 'success': False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=['post'], url_path='summary')
    def summary(self, request):
        """
        Return assessment status summaries for a batch of section/SO/school-year requests.
        Expects:
        {
          "requests": [
            {"section_id": 1, "so_id": 2, "school_year": "2025-2026"}
          ]
        }
        """
        requests_payload = request.data.get('requests', [])
        if not isinstance(requests_payload, list) or len(requests_payload) == 0:
            return Response(
                {'detail': 'requests must be a non-empty list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        normalized_requests = []
        section_ids = set()
        so_ids = set()
        school_years = set()

        try:
            for item in requests_payload:
                section_id = int(item.get('section_id'))
                so_id = int(item.get('so_id'))
                school_year = item.get('school_year', '') or ''
                normalized_requests.append({
                    'section_id': section_id,
                    'so_id': so_id,
                    'school_year': school_year,
                })
                section_ids.add(section_id)
                so_ids.add(so_id)
                school_years.add(school_year)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Each request item must include numeric section_id and so_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sections = {
            section.id: section
            for section in Section.objects.prefetch_related('enrollments').filter(id__in=section_ids)
        }
        assessments = Assessment.objects.prefetch_related('grades').filter(
            section_id__in=section_ids,
            student_outcome_id__in=so_ids,
            school_year__in=school_years,
        )
        assessment_map = {
            (assessment.section_id, assessment.student_outcome_id, assessment.school_year): assessment
            for assessment in assessments
        }

        summaries = []
        for item in normalized_requests:
            section = sections.get(item['section_id'])
            total_students = section.enrollments.count() if section else 0
            assessment = assessment_map.get((item['section_id'], item['so_id'], item['school_year']))
            graded_students = 0

            if assessment:
                student_grade_map = defaultdict(bool)
                for grade in assessment.grades.all():
                    if grade.score is not None:
                        student_grade_map[grade.student_id] = True
                graded_students = sum(1 for has_grade in student_grade_map.values() if has_grade)

            if total_students == 0 or graded_students == 0:
                status_value = 'not-yet'
            elif graded_students == total_students:
                status_value = 'assessed'
            else:
                status_value = 'incomplete'

            summaries.append({
                'section_id': item['section_id'],
                'so_id': item['so_id'],
                'school_year': item['school_year'],
                'total_students': total_students,
                'graded_students': graded_students,
                'status': status_value,
                'last_assessed': assessment.updated_at.isoformat() if assessment else None,
            })

        return Response({'summaries': summaries})

    @action(detail=False, methods=['get'], url_path='export_csv')
    def export_csv(self, request):
        """Export assessment grades as CSV file."""
        section_id = request.query_params.get('section_id')
        so_id = request.query_params.get('so_id')
        school_year = request.query_params.get('school_year', '')

        if not section_id or not so_id:
            return Response(
                {'detail': 'section_id and so_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get section and student outcome info
            section = Section.objects.get(id=section_id)
            so = StudentOutcome.objects.get(id=so_id)
            
            # Get assessment data
            try:
                assessment = Assessment.objects.prefetch_related('grades').get(
                    section_id=section_id,
                    student_outcome_id=so_id,
                    school_year=school_year,
                )
            except Assessment.DoesNotExist:
                assessment = None
            
            # Get all performance indicators and criteria for this SO
            performance_indicators = so.performance_indicators.all().order_by('number')
            assessment_columns = []
            for pi in performance_indicators:
                criteria = pi.criteria.all().order_by('order')
                if criteria.exists():
                    for criterion in criteria:
                        assessment_columns.append({
                            "key": f"criterion:{criterion.id}",
                            "label": f"{pi.number}.{criterion.order}",
                            "basis": criterion.name,
                        })
                else:
                    assessment_columns.append({
                        "key": f"indicator:{pi.id}",
                        "label": f"PI {pi.number}",
                        "basis": pi.description,
                    })
            
            # Get all students in the section
            enrollments = section.enrollments.select_related('student').all()
            students = [e.student for e in enrollments]

            # Build grades dictionary
            grades_by_student = {}
            if assessment:
                for grade in assessment.grades.all():
                    student_id = grade.student_id
                    grade_key = (
                        f"criterion:{grade.criterion_id}"
                        if grade.criterion_id
                        else f"indicator:{grade.performance_indicator_id}"
                    )
                    if student_id not in grades_by_student:
                        grades_by_student[student_id] = {}
                    grades_by_student[student_id][grade_key] = grade.score

            # Create CSV
            output = StringIO()
            writer = csv.writer(output)

            # Header rows with metadata
            writer.writerow(['Assessment Export'])
            writer.writerow(['Section', section.name])
            writer.writerow(['Course', section.course.code, section.course.name])
            writer.writerow(['Student Outcome', so.title])
            writer.writerow(['School Year', school_year])
            writer.writerow(['Assessment Status', 'Complete' if assessment else 'Not Started'])
            writer.writerow([])  # Blank line

            # Column headers
            headers = ['Student ID', 'Student Name']
            for column in assessment_columns:
                headers.append(column["label"])
            headers.append('Average')
            writer.writerow(headers)

            # Student rows
            for student in students:
                row = [student.student_id, f"{student.first_name} {student.last_name}"]
                student_grades = grades_by_student.get(student.id, {})
                scores = []
                
                for column in assessment_columns:
                    score = student_grades.get(column["key"])
                    if score is not None:
                        row.append(score)
                        scores.append(score)
                    else:
                        row.append('')
                
                # Calculate average
                if scores:
                    average = sum(scores) / len(scores)
                    row.append(f"{average:.2f}")
                else:
                    row.append('Not Graded')
                
                writer.writerow(row)

            # Summary row
            writer.writerow([])
            summary_row = ['Summary', 'Total Students: ' + str(len(students))]
            summary_row.extend([''] * (max(len(assessment_columns) - 1, 0)))
            summary_row.append('Class Average')
            
            # Calculate class average
            all_scores = []
            for student_id in grades_by_student:
                scores = list(grades_by_student[student_id].values())
                all_scores.extend([s for s in scores if s is not None])
            
            if all_scores:
                class_average = sum(all_scores) / len(all_scores)
                summary_row.append(f"{class_average:.2f}")
            else:
                summary_row.append('No grades')
            
            writer.writerow(summary_row)

            # Create response
            response = HttpResponse(output.getvalue(), content_type='text/csv')
            filename = f"Assessment_{section.name}_{so.title}_{school_year}.csv"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response

        except Section.DoesNotExist:
            return Response(
                {'detail': 'Section not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except StudentOutcome.DoesNotExist:
            return Response(
                {'detail': 'Student Outcome not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'Error exporting CSV: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


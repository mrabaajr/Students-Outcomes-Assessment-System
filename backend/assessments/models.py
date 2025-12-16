from django.db import models
from users.models import User

class LearningOutcome(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_outcomes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class Assessment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    learning_outcome = models.ForeignKey(LearningOutcome, on_delete=models.CASCADE, related_name='assessments')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assessments')
    assessment_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class AssessmentResult(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_results')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('assessment', 'student')
    
    def __str__(self):
        return f"{self.assessment.title} - {self.student.email}: {self.score}"

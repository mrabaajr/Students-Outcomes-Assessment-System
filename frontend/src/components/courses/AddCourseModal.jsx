import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

const AddCourseModal = ({ isOpen, onClose, onSave, studentOutcomes = [], isSaving = false }) => {
  const [curricula, setCurricula] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [formData, setFormData] = useState({
    curriculum: '',
    selectedCourseId: '',
    code: '',
    name: '',
    semester: '',
    academic_year: '',
    status: 'active',
    mappedSOs: [],
  });

  // Fetch curricula on mount
  useEffect(() => {
    const fetchCurricula = async () => {
      try {
        const res = await fetch('/api/curricula/');
        const data = await res.json();
        setCurricula(data);
      } catch (err) {
        console.error('Error fetching curricula:', err);
      }
    };

    fetchCurricula();
  }, []);

  // Fetch courses when curriculum changes
  useEffect(() => {
    if (!formData.curriculum) return;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await fetch(`/api/courses/?curriculum=${formData.curriculum}`);
        const data = await res.json();
        setCourses(data.results || data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [formData.curriculum]);

  // Autofill when a course is selected
  const handleCourseSelect = (courseId) => {
    setFormData((prev) => {
      if (!courseId) {
        return {
          ...prev,
          selectedCourseId: '',
          code: '',
          name: '',
          semester: '',
          academic_year: '',
        };
      }

      const course = courses.find(c => String(c.id) === String(courseId));
      if (!course) return prev;

      return {
        ...prev,
        selectedCourseId: courseId,
        code: course.code || '',
        name: course.name || '',
        semester: course.semester || '',
        academic_year: course.academic_year || '',
      };
    });
  };

  // Toggle Student Outcome mapping
  const handleSOToggle = (soId) => {
    setFormData(prev => ({
      ...prev,
      mappedSOs: prev.mappedSOs.includes(String(soId))
        ? prev.mappedSOs.filter(id => id !== String(soId))
        : [...prev.mappedSOs, String(soId)],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Course</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Curriculum + Course */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Curriculum *</Label>
              <select
                value={formData.curriculum}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    curriculum: e.target.value,
                    selectedCourseId: '',
                    code: '',
                    name: '',
                    semester: '',
                    academic_year: '',
                  }))
                }
                className="w-full p-2 bg-background border border-border rounded-md"
                required
              >
                <option value="">Select Curriculum</option>
                {curricula.map(curr => (
                  <option key={curr.id} value={curr.id}>
                    {curr.year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Course *</Label>
              <select
                value={formData.selectedCourseId}
                onChange={(e) => handleCourseSelect(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-md"
                disabled={!formData.curriculum}
                required
              >
                <option value="">Select Course</option>
                {loadingCourses && <option>Loading...</option>}
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Course Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Semester + Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semester</Label>
              <Input
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input
                value={formData.academic_year}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
              />
            </div>
          </div>

          {/* SO Mapping */}
          <div className="space-y-3">
            <Label>Map to Student Outcomes</Label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg max-h-64 overflow-y-auto">
              {studentOutcomes.length === 0 ? (
                <p className="col-span-2 text-sm text-muted-foreground text-center py-4">
                  No Student Outcomes available. Please add some first.
                </p>
              ) : (
                studentOutcomes.map(so => (
                  <div key={so.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`so-${so.id}`}
                      checked={formData.mappedSOs.includes(String(so.id))}
                      onCheckedChange={() => handleSOToggle(so.id)}
                    />
                    <div>
                      <Label htmlFor={`so-${so.id}`} className="font-medium cursor-pointer">
                        SO {so.number}: {so.title}
                      </Label>
                      <p className="text-xs text-muted-foreground line-clamp-2">{so.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="status"
              checked={formData.status === 'active'}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                status: checked ? 'active' : 'inactive' 
              }))}
            />
            <Label htmlFor="status">Active Course</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline-block" />
              ) : 'Add Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;

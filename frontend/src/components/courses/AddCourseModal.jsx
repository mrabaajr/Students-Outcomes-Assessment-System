import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { semesters } from '../../data/mockCoursesData';

const AddCourseModal = ({
  isOpen,
  onClose,
  onSave,
  studentOutcomes = [],
  isSaving = false,
  editingCourse = null,
  curriculumOptions = [],
}) => {
  const [curricula, setCurricula] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [formData, setFormData] = useState({
    curriculum: '',
    selectedCourseId: '',
    academic_year: '',
    semester: '',
    code: '',
    name: '',
    year_level: '',
    credits: 3,
    description: '',
    mappedSOs: [],
  });

  // Autofill form if editingCourse exists
  useEffect(() => {
    if (editingCourse) {
      setFormData({
        curriculum: editingCourse.curriculum || '',
        selectedCourseId: editingCourse.course || editingCourse.id || '',
        academic_year: editingCourse.academic_year || '',
        semester: editingCourse.semester || '',
        code: editingCourse.code || '',
        name: editingCourse.name || '',
        year_level: editingCourse.year_level || '',
        credits: editingCourse.credits || 3,
        description: editingCourse.description || '',
        mappedSOs: editingCourse.mappedSOs?.map(id => String(id)) || [],
      });
    } else {
      // Clear form for new course
      setFormData({
        curriculum: '',
        selectedCourseId: '',
        academic_year: '',
        semester: '',
        code: '',
        name: '',
        year_level: '',
        credits: 3,
        description: '',
        mappedSOs: [],
      });
    }
  }, [editingCourse, isOpen]);

  // Fetch curricula on mount
  useEffect(() => {
    const fetchCurricula = async () => {
      if (curriculumOptions.length > 0) {
        setCurricula(curriculumOptions.map(curr => ({
          id: curr,
          year: curr,
        })));
        return;
      }

      try {
        const res = await fetch('/api/curricula/');
        const data = await res.json();
        setCurricula(data);
      } catch (err) {
        console.error('Error fetching curricula:', err);
      }
    };

    fetchCurricula();
  }, [curriculumOptions]);

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

  const handleCourseSelect = (courseId) => {
    setFormData((prev) => {
      if (!courseId) {
        return {
          ...prev,
          selectedCourseId: '',
          academic_year: '',
          semester: '',
          code: '',
          name: '',
        };
      }

      const course = courses.find(c => String(c.id) === String(courseId));
      if (!course) return prev;

      return {
        ...prev,
        selectedCourseId: courseId,
        academic_year: course.academic_year || '',
        semester: course.semester || '',
        code: course.code || '',
        name: course.name || '',
        year_level: course.year_level || '',
        credits: course.credits || 3,
        description: course.description || '',
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
          <DialogTitle className="text-xl font-bold">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Curriculum *</Label>
            <select
              value={formData.curriculum}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  curriculum: e.target.value,
                  selectedCourseId: '',
                  academic_year: '',
                  semester: '',
                  code: '',
                  name: '',
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
            <Label>Course From Database</Label>
            <select
              value={formData.selectedCourseId}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded-md"
              disabled={!formData.curriculum}
            >
              <option value="">Select course to autofill (optional)</option>
              {loadingCourses && <option>Loading...</option>}
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Selecting a course fills the fields below, but you can still edit them for new entries.
            </p>
          </div>

          {/* Academic Year + Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input
                value={formData.academic_year}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="YYYY-YYYY"
              />
            </div>

            <div className="space-y-2">
              <Label>Semester</Label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full p-2 bg-background border border-border rounded-md"
              >
                <option value="">Select Semester</option>
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
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
                placeholder="CPE-101"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Course Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Simple Course Name"
                required
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
              ) : editingCourse ? 'Update Course' : 'Add Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;

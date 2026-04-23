import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { semesters } from '../../data/mockCoursesData';
import { API_BASE_URL, unwrapListResponse } from '@/lib/api';

const yearLevels = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

const courseCodePattern = /^[A-Za-z0-9][A-Za-z0-9-\s]*$/;

const getAutofillClassName = (isAutofilled) =>
  `w-full p-2 border rounded-md ${
    isAutofilled
      ? 'bg-gray-100 border-gray-300 text-gray-500'
      : 'bg-background border-border'
  }`;

const sortCurriculaByYear = (items = []) =>
  [...items].sort((a, b) => Number(a.year || a.id || 0) - Number(b.year || b.id || 0));

const AddCourseModal = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  editingCourse = null,
  curriculumOptions = [],
}) => {
  const { toast } = useToast();
  const [curricula, setCurricula] = useState([]);
  const [databaseCourses, setDatabaseCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loadingDatabaseCourses, setLoadingDatabaseCourses] = useState(false);
  const [errors, setErrors] = useState({});
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    curriculum: '',
    selectedCourseId: '',
    semester: '',
    code: '',
    name: '',
    year_level: '',
    credits: 3,
    description: '',
  });

  // Autofill form if editingCourse exists
  useEffect(() => {
    if (editingCourse) {
      setFormData({
        curriculum: editingCourse.curriculum || '',
        selectedCourseId: editingCourse.course || editingCourse.id || '',
        semester: editingCourse.semester || '',
        code: editingCourse.code || '',
        name: editingCourse.name || '',
        year_level: editingCourse.year_level || '',
        credits: editingCourse.credits || 3,
        description: editingCourse.description || '',
      });
    } else {
      // Clear form for new course
      setFormData({
        curriculum: '',
        selectedCourseId: '',
        semester: '',
        code: '',
        name: '',
        year_level: '',
        credits: 3,
        description: '',
      });
    }
    setErrors({});
    setShowNameSuggestions(false);
  }, [editingCourse, isOpen]);

  // Fetch curricula on mount
  useEffect(() => {
    const fetchCurricula = async () => {
      if (curriculumOptions.length > 0) {
        setCurricula(sortCurriculaByYear(curriculumOptions.map(curr => ({
          id: curr,
          year: curr,
        }))));
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/curricula/`);
        const data = await res.json();
        setCurricula(sortCurriculaByYear(unwrapListResponse(data)));
      } catch (err) {
        console.error('Error fetching curricula:', err);
      }
    };

    fetchCurricula();
  }, [curriculumOptions]);

  // Fetch saved courses when curriculum changes so the form can autofill from the course database.
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/courses/`);
        const data = await res.json();
        setAllCourses(unwrapListResponse(data));
      } catch (err) {
        console.error('Error fetching all courses:', err);
        setAllCourses([]);
      }
    };

    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (!formData.curriculum) {
      setDatabaseCourses([]);
      return;
    }

    const fetchDatabaseCourses = async () => {
      setLoadingDatabaseCourses(true);
      try {
        const res = await fetch(`${API_BASE_URL}/courses/?curriculum=${encodeURIComponent(formData.curriculum)}`);
        const data = await res.json();
        setDatabaseCourses(unwrapListResponse(data));
      } catch (err) {
        console.error('Error fetching database courses:', err);
        setDatabaseCourses([]);
      } finally {
        setLoadingDatabaseCourses(false);
      }
    };

    fetchDatabaseCourses();
  }, [formData.curriculum]);

  const validateField = (name, value) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;

    switch (name) {
      case 'curriculum':
        return trimmedValue ? '' : 'Please select a curriculum.';
      case 'semester':
        return trimmedValue ? '' : 'Please select a semester.';
      case 'year_level':
        return trimmedValue ? '' : 'Please select a year level.';
      case 'code':
        if (!trimmedValue) return 'Please enter a course code.';
        return courseCodePattern.test(trimmedValue)
          ? ''
          : 'Please enter a valid course code.';
      case 'name':
        if (!trimmedValue) return 'Please enter a course name.';
        return trimmedValue.length >= 3
          ? ''
          : 'Course name must be at least 3 characters.';
      default:
        return '';
    }
  };

  const updateField = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
      const nextError = validateField(name, value);
      if (!nextError && !prev[name]) return prev;
      return { ...prev, [name]: nextError };
    });
  };

  const validateForm = (data = formData) => {
    const nextErrors = {
      curriculum: validateField('curriculum', data.curriculum),
      semester: validateField('semester', data.semester),
      year_level: validateField('year_level', data.year_level),
      code: validateField('code', data.code),
      name: validateField('name', data.name),
    };

    const filteredErrors = Object.fromEntries(
      Object.entries(nextErrors).filter(([, value]) => value)
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  const handleCourseSelect = (courseId) => {
    setFormData((prev) => {
      if (!courseId) {
        return {
          ...prev,
          selectedCourseId: '',
          semester: '',
          year_level: '',
          code: '',
          name: '',
        };
      }

      const course = allCourses.find(c => String(c.id) === String(courseId))
        || databaseCourses.find(c => String(c.id) === String(courseId));
      if (!course) return prev;

      return {
        ...prev,
        curriculum: course.curriculum_year || course.curriculum || prev.curriculum,
        selectedCourseId: courseId,
        semester: course.semester || '',
        code: course.code || '',
        name: course.name || '',
        year_level: course.year_level || '',
        credits: course.credits || 3,
        description: course.description || '',
      };
    });
    setErrors(prev => ({
      ...prev,
      semester: '',
      year_level: '',
      code: '',
      name: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) {
      toast({
        title: 'Invalid Course Details',
        description: 'Please correct the highlighted fields before submitting.',
        variant: 'destructive',
      });
      return;
    }

    await onSave(formData);
  };

  const isAutofilledFromCourse = Boolean(formData.selectedCourseId);
  const courseNameSuggestions = useMemo(() => {
    const query = formData.name.trim().toLowerCase();

    if (!showNameSuggestions || !formData.curriculum || query.length < 2) {
      return [];
    }

    return allCourses
      .filter((course) => {
        const name = String(course.name || '').toLowerCase();
        const code = String(course.code || '').toLowerCase();
        return name.includes(query) || code.includes(query);
      })
      .slice(0, 5);
  }, [allCourses, formData.name, showNameSuggestions]);

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
                  semester: '',
                  year_level: '',
                  code: '',
                  name: '',
                }))
              }
              onBlur={(e) => setErrors(prev => ({ ...prev, curriculum: validateField('curriculum', e.target.value) }))}
              className={getAutofillClassName(isAutofilledFromCourse)}
              required
            >
              <option value="">Select Curriculum</option>
              {curricula.map(curr => (
                <option key={curr.id} value={curr.id}>
                  {curr.year}
                </option>
              ))}
            </select>
            {errors.curriculum ? <p className="text-sm text-destructive">{errors.curriculum}</p> : null}
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
              {loadingDatabaseCourses && <option>Loading...</option>}
              {databaseCourses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} ({course.year_level || 'No year level'} | {course.semester || 'No semester'})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Selecting an existing course fills the code, name, year level, and semester from the saved course record.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Course Name *</Label>
            <div className="relative">
              <Input
                value={formData.name}
                onChange={(e) => {
                  updateField('name', e.target.value);
                  setShowNameSuggestions(true);
                  if (formData.selectedCourseId) {
                    setFormData((prev) => ({ ...prev, selectedCourseId: '' }));
                  }
                }}
                onFocus={() => setShowNameSuggestions(true)}
                onBlur={(e) => {
                  setErrors(prev => ({ ...prev, name: validateField('name', e.target.value) }));
                  window.setTimeout(() => setShowNameSuggestions(false), 150);
                }}
                placeholder="Simple Course Name"
                className={isAutofilledFromCourse ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                required
              />
              {courseNameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-[#D1D5DB] bg-white shadow-lg">
                  {courseNameSuggestions.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onMouseDown={() => handleCourseSelect(course.id)}
                      className="flex w-full items-start justify-between gap-3 border-b border-[#E5E7EB] px-3 py-2 text-left transition hover:bg-[#FFF8DB] last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#231F20]">{course.name}</p>
                        <p className="text-xs text-[#6B6B6B]">{course.code}</p>
                      </div>
                      <span className="text-xs text-[#6B6B6B]">{course.semester || 'No semester'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Course Code *</Label>
            <Input
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value.toUpperCase())}
              onBlur={(e) => setErrors(prev => ({ ...prev, code: validateField('code', e.target.value) }))}
              placeholder="CPE 101"
              className={isAutofilledFromCourse ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
              required
            />
            {errors.code ? <p className="text-sm text-destructive">{errors.code}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Semester *</Label>
            <select
              value={formData.semester}
              onChange={(e) => updateField('semester', e.target.value)}
              onBlur={(e) => setErrors(prev => ({ ...prev, semester: validateField('semester', e.target.value) }))}
              className={getAutofillClassName(isAutofilledFromCourse)}
              required
            >
              <option value="">Select Semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
            {errors.semester ? <p className="text-sm text-destructive">{errors.semester}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Year Level *</Label>
            <select
              value={formData.year_level}
              onChange={(e) => updateField('year_level', e.target.value)}
              onBlur={(e) => setErrors(prev => ({ ...prev, year_level: validateField('year_level', e.target.value) }))}
              className={getAutofillClassName(isAutofilledFromCourse)}
              required
            >
              <option value="">Select Year Level</option>
              {yearLevels.map((yearLevel) => (
                <option key={yearLevel} value={yearLevel}>
                  {yearLevel}
                </option>
              ))}
            </select>
            {errors.year_level ? <p className="text-sm text-destructive">{errors.year_level}</p> : null}
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

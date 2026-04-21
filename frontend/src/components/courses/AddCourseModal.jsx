import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { academicYears as fallbackAcademicYears, semesters } from '../../data/mockCoursesData';
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

const AddCourseModal = ({
  isOpen,
  onClose,
  onSave,
  studentOutcomes = [],
  isSaving = false,
  editingCourse = null,
  curriculumOptions = [],
}) => {
  const { toast } = useToast();
  const [curricula, setCurricula] = useState([]);
  const [databaseCourses, setDatabaseCourses] = useState([]);
  const [academicYears, setAcademicYears] = useState(fallbackAcademicYears);
  const [loadingDatabaseCourses, setLoadingDatabaseCourses] = useState(false);
  const [errors, setErrors] = useState({});

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
    setErrors({});
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
        const res = await fetch(`${API_BASE_URL}/curricula/`);
        const data = await res.json();
        setCurricula(unwrapListResponse(data));
      } catch (err) {
        console.error('Error fetching curricula:', err);
      }
    };

    fetchCurricula();
  }, [curriculumOptions]);

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/school-years/`);
        const data = await res.json();
        const years = unwrapListResponse(data)
          .map((item) => item.year)
          .filter(Boolean);

        if (years.length > 0) {
          setAcademicYears(years);
        }
      } catch (err) {
        console.error('Error fetching academic years:', err);
        setAcademicYears(fallbackAcademicYears);
      }
    };

    fetchAcademicYears();
  }, []);

  // Fetch saved courses when curriculum changes so the form can autofill from the course database.
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
      case 'academic_year':
        if (!trimmedValue) return 'Please select an academic year.';
        return academicYears.includes(trimmedValue)
          ? ''
          : 'Please select a valid academic year.';
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

  const validateForm = () => {
    const nextErrors = {
      curriculum: validateField('curriculum', formData.curriculum),
      academic_year: validateField('academic_year', formData.academic_year),
      semester: validateField('semester', formData.semester),
      year_level: validateField('year_level', formData.year_level),
      code: validateField('code', formData.code),
      name: validateField('name', formData.name),
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
          academic_year: '',
          semester: '',
          year_level: '',
          code: '',
          name: '',
        };
      }

      const course = databaseCourses.find(c => String(c.id) === String(courseId));
      if (!course) return prev;

      return {
        ...prev,
        selectedCourseId: courseId,
        academic_year: prev.academic_year,
        semester: course.semester || '',
        code: course.code || '',
        name: course.name || '',
        year_level: course.year_level || '',
        credits: course.credits || 3,
        description: course.description || '',
        mappedSOs: course.mappedSOs || [],
      };
    });
    setErrors(prev => ({
      ...prev,
      academic_year: '',
      semester: '',
      year_level: '',
      code: '',
      name: '',
    }));
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
    if (!validateForm()) {
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

          {/* Academic Year + Semester + Year Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <select
                value={formData.academic_year}
                onChange={(e) => updateField('academic_year', e.target.value)}
                onBlur={(e) => setErrors(prev => ({ ...prev, academic_year: validateField('academic_year', e.target.value) }))}
                className={getAutofillClassName(isAutofilledFromCourse)}
                required
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((academicYear) => (
                  <option key={academicYear} value={academicYear}>
                    {academicYear}
                  </option>
                ))}
              </select>
              {errors.academic_year ? <p className="text-sm text-destructive">{errors.academic_year}</p> : null}
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
          </div>

          {/* Course Code + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                onBlur={(e) => setErrors(prev => ({ ...prev, code: validateField('code', e.target.value) }))}
                placeholder="CPE-101"
                className={isAutofilledFromCourse ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                required
              />
              {errors.code ? <p className="text-sm text-destructive">{errors.code}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Course Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                onBlur={(e) => setErrors(prev => ({ ...prev, name: validateField('name', e.target.value) }))}
                placeholder="Simple Course Name"
                className={isAutofilledFromCourse ? 'bg-gray-100 border-gray-300 text-gray-500' : ''}
                required
              />
              {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
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

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

const AddCourseModal = ({ isOpen, onClose, onSave, editingCourse, studentOutcomes = [], isSaving = false }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Computer Engineering',
    semester: '1st Semester',
    academicYear: '2024-2025',
    studentCount: 0,
    status: 'active',
    mappedSOs: [],
  });

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        code: editingCourse.code || '',
        name: editingCourse.name || '',
        department: editingCourse.department || 'Computer Engineering',
        semester: editingCourse.semester || '1st Semester',
        academicYear: editingCourse.academicYear || '2024-2025',
        studentCount: editingCourse.studentCount || 0,
        status: editingCourse.status || 'active',
        mappedSOs: editingCourse.mappedSOs || [],
      });
    } else {
      setFormData(prev => ({
        ...prev,
        mappedSOs: [],
      }));
    }
  }, [editingCourse, isOpen]);

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
          {/* Course Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., CPE 406"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., CPE Design 1"
                required
              />
            </div>
          </div>

          {/* Department / Semester / Academic Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full p-2 bg-background border border-border rounded-md"
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full p-2 bg-background border border-border rounded-md"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year</Label>
            <select
              id="academicYear"
              value={formData.academicYear}
              onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
              className="w-full p-2 bg-background border border-border rounded-md"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>

          {/* Student Count */}
          <div className="space-y-2">
            <Label htmlFor="studentCount">Student Count</Label>
            <Input
              id="studentCount"
              type="number"
              value={formData.studentCount}
              onChange={(e) => setFormData(prev => ({ ...prev, studentCount: parseInt(e.target.value) || 0 }))}
              min="0"
            />
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
              ) : editingCourse ? 'Save Changes' : 'Add Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseModal;

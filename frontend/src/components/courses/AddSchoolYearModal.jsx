import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const initialFormData = {
  year: '',
};

const schoolYearPattern = /^\d{4}-\d{4}$/;

const AddSchoolYearModal = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  existingSchoolYears = [],
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedYear = formData.year.trim();
    if (!normalizedYear) {
      setError('School year is required.');
      return;
    }

    if (!schoolYearPattern.test(normalizedYear)) {
      setError('Enter a valid school year like 2026-2027.');
      return;
    }

    const [startYear, endYear] = normalizedYear.split('-').map(Number);
    if (endYear !== startYear + 1) {
      setError('School year must span consecutive years.');
      return;
    }

    if (existingSchoolYears.includes(normalizedYear)) {
      setError('That school year already exists.');
      return;
    }

    setError('');
    await onSave({ year: normalizedYear });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add School Year</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="school-year">School Year *</Label>
            <Input
              id="school-year"
              value={formData.year}
              onChange={(e) => setFormData({ year: e.target.value })}
              placeholder="e.g. 2026-2027"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

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
              ) : 'Save School Year'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSchoolYearModal;

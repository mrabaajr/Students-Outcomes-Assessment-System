import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const initialFormData = {
  name: '',
};

const AddCurriculumModal = ({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  existingCurriculums = [],
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

    const normalizedName = formData.name.trim();
    if (!normalizedName) {
      setError('Curriculum name is required.');
      return;
    }

    if (existingCurriculums.includes(normalizedName)) {
      setError('That curriculum already exists.');
      return;
    }

    setError('');
    await onSave({ name: normalizedName });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Curriculum</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="curriculum-name">Curriculum Name *</Label>
            <Input
              id="curriculum-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. 2027 Curriculum"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

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
              ) : 'Save Curriculum'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCurriculumModal;

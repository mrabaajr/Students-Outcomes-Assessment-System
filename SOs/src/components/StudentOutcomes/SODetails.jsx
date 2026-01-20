import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function SODetails({ outcome, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(outcome.description);

  const handleSave = () => {
    onUpdate({ description: editValue });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(outcome.description);
    setIsEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
              SO {outcome.number}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{outcome.title}</h2>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[100px] border-2 focus:border-primary"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground leading-relaxed">{outcome.description}</p>
          )}
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

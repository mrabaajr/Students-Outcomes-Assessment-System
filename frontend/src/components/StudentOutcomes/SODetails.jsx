import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

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
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-black text-white text-sm font-semibold rounded-full">
              {outcome.code}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{outcome.title}</h2>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[100px] border-2 focus:border-black"
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
            <p className="text-gray-600 leading-relaxed">{outcome.description}</p>
          )}
        </div>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-black hover:bg-gray-100"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

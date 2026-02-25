import { useState } from 'react';
import { Pencil, Check, X, Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function PITable({ indicators, onAdd, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (pi) => {
    setEditingId(pi.id);
    setEditValue(pi.name);
  };

  const handleSave = (piId) => {
    onUpdate(piId, { name: editValue });
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Performance Indicators</h3>
        <Button onClick={onAdd} size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          Add new P.I.
        </Button>
      </div>

      <div className="grid gap-3">
        {indicators.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No performance indicators yet. Click "Add new P.I." to create one.
          </div>
        ) : (
          indicators.map((pi) => (
            <div
              key={pi.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                {pi.id}
              </div>
              <div className="flex-1">
                {editingId === pi.id ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="border-2 focus:border-black"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(pi.id);
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                ) : (
                  <p className="text-gray-900">{pi.name}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {editingId === pi.id ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleSave(pi.id)} className="hover:bg-green-100">
                      <Check className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel} className="hover:bg-red-100">
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(pi)} className="hover:bg-gray-100 hover:text-black">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(pi.id)} className="hover:bg-red-100">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

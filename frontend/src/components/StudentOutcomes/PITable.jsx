import { useState } from 'react';
import { Pencil, Check, X, Trash2, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function PITable({
  indicators,
  onAdd,
  onUpdate,
  onDelete,
  onAddCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [editingCriterion, setEditingCriterion] = useState(null);
  const [editCriterionValue, setEditCriterionValue] = useState('');

  // ---------------------------
  // PI EDIT HANDLERS
  // ---------------------------

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

  // ---------------------------
  // CRITERION EDIT HANDLERS
  // ---------------------------

  const handleEditCriterion = (piId, criterion) => {
    setEditingCriterion({ piId, criterionId: criterion.id });
    setEditCriterionValue(criterion.description);
  };

  const handleSaveCriterion = (piId, criterionId) => {
    onUpdateCriterion(piId, criterionId, {
      description: editCriterionValue,
    });
    setEditingCriterion(null);
    setEditCriterionValue('');
  };

  const handleCancelCriterion = () => {
    setEditingCriterion(null);
    setEditCriterionValue('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          Performance Indicators
        </h3>
        <Button onClick={onAdd} size="sm" className="rounded-full">
          <Plus className="w-4 h-4 mr-1" />
          Add new P.I.
        </Button>
      </div>

      {/* PI LIST */}
      <div className="grid gap-4">
        {indicators.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No performance indicators yet. Click "Add new P.I." to create one.
          </div>
        ) : (
          indicators.map((pi) => (
            <div
              key={pi.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              {/* PI ROW */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {pi.number}
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(pi.id)}
                        className="hover:bg-green-100"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        className="hover:bg-red-100"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(pi)}
                        className="hover:bg-gray-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(pi.id)}
                        className="hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* ------------------ */}
              {/* PERFORMANCE CRITERIA */}
              {/* ------------------ */}

              <div className="mt-4 space-y-2">
                {pi.performanceCriteria?.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="ml-10 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3"
                  >
                    {editingCriterion?.criterionId === criterion.id ? (
                      <>
                        <Input
                          value={editCriterionValue}
                          onChange={(e) =>
                            setEditCriterionValue(e.target.value)
                          }
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              handleSaveCriterion(
                                pi.id,
                                criterion.id
                              );
                            if (e.key === 'Escape')
                              handleCancelCriterion();
                          }}
                        />

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleSaveCriterion(
                              pi.id,
                              criterion.id
                            )
                          }
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelCriterion}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-sm text-gray-700">
                          {criterion.description || (
                            <span className="italic text-gray-400">
                              Empty criterion
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleEditCriterion(pi.id, criterion)
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onDeleteCriterion(
                              pi.id,
                              criterion.id
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {/* Add Criterion Button */}
                <div className="ml-10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddCriterion(pi.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Criterion
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
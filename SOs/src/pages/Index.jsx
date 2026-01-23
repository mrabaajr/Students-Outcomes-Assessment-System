import { useState, useEffect } from 'react';
import { useStudentOutcomes } from '@/hooks/useStudentOutcomes';
import { Header } from '@/components/StudentOutcomes/Header';
import { SOTabs } from '@/components/StudentOutcomes/SOTabs';
import { SODetails } from '@/components/StudentOutcomes/SODetails';
import { PITable } from '@/components/StudentOutcomes/PITable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    outcomes,
    hasUnsavedChanges,
    saveToStorage,
    updateOutcome,
    addOutcome,
    deleteOutcome,
    addPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
  } = useStudentOutcomes();

  const [selectedId, setSelectedId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (outcomes.length > 0 && (!selectedId || !outcomes.find(o => o.id === selectedId))) {
      setSelectedId(outcomes[0].id);
    }
  }, [outcomes, selectedId]);

  const selectedOutcome = outcomes.find((o) => o.id === selectedId);

  const handleAddOutcome = () => {
    const newOutcome = addOutcome();
    setSelectedId(newOutcome.id);
  };

  const handleDeleteOutcome = (id) => {
    deleteOutcome(id);
    if (selectedId === id && outcomes.length > 1) {
      const remaining = outcomes.filter(o => o.id !== id);
      setSelectedId(remaining[0]?.id || null);
    }
  };

  const handleSave = () => {
    saveToStorage();
    toast({
      title: 'Changes saved',
      description: 'Your changes have been saved to local storage.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SOTabs
        outcomes={outcomes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={handleAddOutcome}
        onDelete={handleDeleteOutcome}
      />

      <main className="px-6 py-8 space-y-6">
        {selectedOutcome ? (
          <>
            <SODetails
              outcome={selectedOutcome}
              onUpdate={(updates) => updateOutcome(selectedOutcome.id, updates)}
            />

            <PITable
              indicators={selectedOutcome.performanceIndicators}
              onAdd={() => addPerformanceIndicator(selectedOutcome.id)}
              onUpdate={(piId, description) =>
                updatePerformanceIndicator(selectedOutcome.id, piId, description)
              }
              onDelete={(piId) => deletePerformanceIndicator(selectedOutcome.id, piId)}
            />

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                size="lg"
                disabled={!hasUnsavedChanges}
                className="rounded-full px-8"
              >
                Save Changes
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No student outcomes yet. Click "Add new SO" to create one.
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

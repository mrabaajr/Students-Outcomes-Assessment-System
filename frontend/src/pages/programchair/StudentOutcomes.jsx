import { useState, useEffect } from 'react';
import { useStudentOutcomes } from '../../hooks/useStudentOutcomes';
import { SOTabs } from '../../components/StudentOutcomes/SOTabs';
import { SODetails } from '../../components/StudentOutcomes/SODetails';
import { PITable } from '../../components/StudentOutcomes/PITable';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import Navbar from '../../components/dashboard/Navbar';
import Footer from '../../components/dashboard/Footer';
import { Plus, Settings, Loader2 } from 'lucide-react';

const StudentOutcomes = () => {
  const {
    outcomes,
    hasUnsavedChanges,
    isLoading,
    error,
    saveToBackend,
    updateOutcome,
    addOutcome,
    deleteOutcome,
    addPerformanceIndicator,
    updatePerformanceIndicator,
    deletePerformanceIndicator,
  } = useStudentOutcomes();

  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveToBackend();
    setIsSaving(false);
    
    if (result.success) {
      toast({
        title: 'Changes saved',
        description: 'Your changes have been saved to the database.',
      });
    } else {
      toast({
        title: 'Error saving changes',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FFC20E]" />
            <p className="text-[#6B6B6B]">Loading student outcomes...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              OUTCOMES MANAGEMENT
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-white">Student Outcomes</span>
              <br />
              <span className="text-[#FFC20E]">Configuration</span>
            </h1>

            <p className="text-[#A5A8AB] max-w-xl mb-8">
              Define and manage student outcomes, performance indicators, and evaluation criteria
              for your program assessment.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleAddOutcome}
                className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-6 py-3 rounded-lg font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Plus size={18} />
                <span>ADD NEW SO</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex items-center gap-2 bg-transparent text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Settings size={18} />
                )}
                <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <SOTabs
            outcomes={outcomes}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={handleAddOutcome}
            onDelete={handleDeleteOutcome}
          />

          <div className="mt-6 space-y-6">
            {selectedOutcome ? (
              <>
                <SODetails
                  outcome={selectedOutcome}
                  onUpdate={(updates) => updateOutcome(selectedOutcome.id, updates)}
                />

                <PITable
                  indicators={selectedOutcome.performanceIndicators}
                  onAdd={() => addPerformanceIndicator(selectedOutcome.id)}
                  onUpdate={(piId, updates) =>
                    updatePerformanceIndicator(selectedOutcome.id, piId, updates)
                  }
                  onDelete={(piId) => deletePerformanceIndicator(selectedOutcome.id, piId)}
                />
              </>
            ) : (
              <div className="glass-card p-12 text-center">
                <Settings className="w-16 h-16 mx-auto mb-4 text-[#A5A8AB]" />
                <h3 className="text-lg font-semibold text-[#231F20] mb-2">No Student Outcomes</h3>
                <p className="text-[#6B6B6B] mb-6">
                  Get started by creating your first student outcome
                </p>
                <Button
                  onClick={handleAddOutcome}
                  className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New SO
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentOutcomes;

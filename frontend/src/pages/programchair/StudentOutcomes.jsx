import { useState, useEffect } from 'react';
import { useStudentOutcomes } from '../../hooks/useStudentOutcomes';
import { SOTabs } from '../../components/StudentOutcomes/SOTabs';
import { SODetails } from '../../components/StudentOutcomes/SODetails';
import { PITable } from '../../components/StudentOutcomes/PITable';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import Navbar from '../../components/dashboard/Navbar';
import Footer from '../../components/dashboard/Footer';
import { Plus, Settings } from 'lucide-react';

const StudentOutcomes = () => {
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              OUTCOMES MANAGEMENT
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
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
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2 bg-transparent text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Settings size={18} />
                <span>SAVE CHANGES</span>
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onUpdate={(piId, description) =>
                    updatePerformanceIndicator(selectedOutcome.id, piId, description)
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

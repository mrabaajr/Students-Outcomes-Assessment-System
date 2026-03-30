import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import { SOCard, SOFormDialog } from "@/components/StudentOutcomes/SOCard";
import { RubricModal } from "@/components/StudentOutcomes/RubricModal";
import { useStudentOutcomes } from "@/hooks/useStudentOutcomes";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StudentOutcomes = () => {
  const { toast } = useToast();
  const {
    outcomes: backendOutcomes,
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
    addPerformanceCriterion,
    updatePerformanceCriterion,
    deletePerformanceCriterion,
  } = useStudentOutcomes();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSO, setEditingSO] = useState(null);
  const [rubricSO, setRubricSO] = useState(null);
  const [pendingAutoSave, setPendingAutoSave] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [deletingSO, setDeletingSO] = useState(null);

  // Transform backend format (performanceIndicators/performanceCriteria) to UI format (indicators/criteria)
  const transformToUIFormat = (outcome) => ({
    ...outcome,
    indicators: (outcome.performanceIndicators || []).map((pi) => ({
      ...pi,
      description: pi.description || pi.name || "",
      criteria: pi.performanceCriteria || [],
    })),
  });

  // Transform UI format back to backend format
  const transformToBackendFormat = (outcome) => ({
    ...outcome,
    performanceIndicators: (outcome.indicators || []).map((pi) => ({
      ...pi,
      name: pi.description || pi.name || "",
      performanceCriteria: pi.criteria || [],
    })),
  });

  const outcomes = backendOutcomes.map(transformToUIFormat);

  const handleAddOrEdit = async (so) => {
    const backendSO = transformToBackendFormat(so);
    
    if (backendSO.id && typeof backendSO.id === "number") {
      // Editing existing outcome
      updateOutcome(backendSO.id, backendSO);
      setPendingAction({
        title: "Student Outcome Updated",
        description: `${so.title} was saved successfully.`,
      });
    } else {
      // Adding new outcome - need to add it first
      const newOutcome = addOutcome();
      // Update the newly added outcome with the form data
      updateOutcome(newOutcome.id, { ...backendSO, id: newOutcome.id });
      setPendingAction({
        title: "Student Outcome Added",
        description: `${so.title} was added successfully.`,
      });
    }
    
    setEditingSO(null);
    setPendingAutoSave(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingSO) return;

    deleteOutcome(deletingSO.id);
    setPendingAction({
      title: "Student Outcome Deleted",
      description: `${deletingSO.title} was deleted successfully.`,
    });
    setDeletingSO(null);
    setPendingAutoSave(true);
  };

  const handleSaveRubric = async (so) => {
    const backendSO = transformToBackendFormat(so);
    updateOutcome(so.id, { ...backendSO, id: so.id });
    setRubricSO(null);
    setPendingAction({
      title: "Rubric Updated",
      description: `${so.title} rubric changes were saved successfully.`,
    });
    setPendingAutoSave(true);
  };

  const handleManualSave = async () => {
    const result = await saveToBackend();
    if (result.success) {
      toast({
        title: "Changes Saved",
        description: "Student outcomes were saved successfully.",
      });
    } else {
      toast({
        title: "Save Failed",
        description: result.message || "Failed to save student outcomes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!pendingAutoSave || !hasUnsavedChanges) return;

    let isCancelled = false;

    const persistChanges = async () => {
      const result = await saveToBackend();
      if (!isCancelled && result.success) {
        if (pendingAction) {
          toast({
            title: pendingAction.title,
            description: pendingAction.description,
          });
        }
        setPendingAction(null);
        setPendingAutoSave(false);
      } else if (!isCancelled && !result.success) {
        toast({
          title: "Save Failed",
          description: result.message || "Failed to save student outcomes.",
          variant: "destructive",
        });
      }
    };

    persistChanges();

    return () => {
      isCancelled = true;
    };
  }, [pendingAutoSave, hasUnsavedChanges, outcomes, pendingAction, saveToBackend, toast]);

  const usedNumbers = new Set(outcomes.map((s) => s.number));
  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) nextNumber++;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              OUTCOMES MANAGEMENT
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-white">Student</span>
              <br />
              <span className="text-[#FFC20E]">Outcomes</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6 sm:mb-8">
              Define and manage student outcomes, performance indicators, and
              evaluation criteria for your program assessment.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => { setEditingSO(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                ADD NEW SO
              </button>
              {hasUnsavedChanges && (
                <button
                  onClick={handleManualSave}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Error: {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && outcomes.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="rounded-xl border-2 border-dashed border-[#A5A8AB] bg-white p-12 text-center">
              <p className="text-[#6B6B6B]">Loading student outcomes...</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col gap-4">
              {[...outcomes].sort((a, b) => a.number - b.number).map((so) => (
                <SOCard
                  key={so.id}
                  so={so}
                  onEdit={(s) => { setEditingSO(s); setFormOpen(true); }}
                  onDelete={(id) => {
                    const soToDelete = outcomes.find((item) => item.id === id);
                    if (soToDelete) {
                      setDeletingSO(soToDelete);
                    }
                  }}
                  onOpenRubric={setRubricSO}
                />
              ))}
            </div>
            {outcomes.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-[#A5A8AB] bg-white p-12 text-center mt-4">
                <p className="text-[#6B6B6B]">
                  No student outcomes yet. Click "ADD NEW SO" to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />

      <SOFormDialog
        key={editingSO?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleAddOrEdit}
        editingSO={editingSO}
        nextNumber={nextNumber}
      />
      {rubricSO && (
        <RubricModal
          open={!!rubricSO}
          onOpenChange={(open) => !open && setRubricSO(null)}
          studentOutcome={rubricSO}
          onSave={handleSaveRubric}
        />
      )}
      <AlertDialog open={!!deletingSO} onOpenChange={(open) => !open && setDeletingSO(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student Outcome?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingSO
                ? `This will permanently remove ${deletingSO.title} and its rubric details.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentOutcomes;

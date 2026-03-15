import { useState } from "react";
import { Plus } from "lucide-react";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import { SOCard, SOFormDialog } from "@/components/StudentOutcomes/SOCard";
import { RubricModal } from "@/components/StudentOutcomes/RubricModal";
import { initialStudentOutcomes } from "@/data/studentOutcomes";

const StudentOutcomes = () => {
  const [outcomes, setOutcomes] = useState(initialStudentOutcomes);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSO, setEditingSO] = useState(null);
  const [rubricSO, setRubricSO] = useState(null);

  const handleAddOrEdit = (so) => {
    setOutcomes((prev) => {
      const exists = prev.find((s) => s.id === so.id);
      if (exists) return prev.map((s) => (s.id === so.id ? so : s));
      return [...prev, so];
    });
    setEditingSO(null);
  };

  const handleDelete = (id) => {
    setOutcomes((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveRubric = (so) => {
    setOutcomes((prev) => prev.map((s) => (s.id === so.id ? so : s)));
    setRubricSO(null);
  };

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
            <button
              onClick={() => { setEditingSO(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              ADD NEW SO
            </button>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col gap-4">
            {[...outcomes].sort((a, b) => a.number - b.number).map((so) => (
              <SOCard
                key={so.id}
                so={so}
                onEdit={(s) => { setEditingSO(s); setFormOpen(true); }}
                onDelete={handleDelete}
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
    </div>
  );
};

export default StudentOutcomes;

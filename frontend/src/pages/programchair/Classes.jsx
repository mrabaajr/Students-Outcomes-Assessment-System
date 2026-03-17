import { useState, useEffect } from "react";
import { BookOpen, Users, Plus, Settings, Loader2 } from "lucide-react";
import axios from "axios";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import SectionCard from "@/components/classes/SectionCard";
import FacultyCard from "@/components/classes/FacultyCard";
import SectionFormDialog from "@/components/classes/SectionFormDialog";
import StudentFormDialog from "@/components/classes/StudentFormDialog";
import FacultyFormDialog from "@/components/classes/FacultyFormDialog";
import DeleteConfirmDialog from "@/components/classes/DeleteConfirmDialog";
import { sections as initialSections, faculty as initialFaculty } from "@/data/classesData";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("sections");
  const [sectionsData, setSectionsData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from backend on mount; fall back to mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get('/api/sections/load_all/');
        const { sections, faculty } = response.data;
        if (sections.length > 0) {
          setSectionsData(sections);
          setFacultyData(faculty);
        } else {
          setSectionsData(initialSections);
          setFacultyData(initialFaculty);
        }
      } catch (error) {
        console.error('Failed to load classes from backend:', error);
        setSectionsData(initialSections);
        setFacultyData(initialFaculty);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Section CRUD
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deleteSection, setDeleteSection] = useState(null);

  // Student CRUD
  const [studentDialog, setStudentDialog] = useState(false);
  const [studentSectionId, setStudentSectionId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);

  // Faculty CRUD
  const [facultyDialog, setFacultyDialog] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deleteFacultyId, setDeleteFacultyId] = useState(null);

  // --- Section handlers ---
  const handleSaveSection = (data) => {
    if (editingSection) {
      setSectionsData(prev => prev.map(s => s.id === editingSection.id ? { ...s, ...data } : s));
      toast({ title: "Section updated successfully" });
    } else {
      const newSection = { ...data, id: Date.now().toString(), students: [] };
      setSectionsData(prev => [...prev, newSection]);
      toast({ title: "Section added successfully" });
    }
    setEditingSection(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteSection = () => {
    if (deleteSection) {
      setSectionsData(prev => prev.filter(s => s.id !== deleteSection));
      toast({ title: "Section deleted" });
      setDeleteSection(null);
      setHasUnsavedChanges(true);
    }
  };

  // --- Student handlers ---
  const handleAddStudent = (sectionId) => {
    setStudentSectionId(sectionId);
    setEditingStudent(null);
    setStudentDialog(true);
  };

  const handleEditStudent = (sectionId, student) => {
    setStudentSectionId(sectionId);
    setEditingStudent(student);
    setStudentDialog(true);
  };

  const handleSaveStudent = (data) => {
    if (!studentSectionId) return;
    setSectionsData(prev => prev.map(section => {
      if (section.id !== studentSectionId) return section;
      if (editingStudent) {
        return { ...section, students: section.students.map(s => s.id === editingStudent.id ? { ...s, ...data } : s) };
      }
      return { ...section, students: [...section.students, { ...data, id: `s${Date.now()}` }] };
    }));
    toast({ title: editingStudent ? "Student updated" : "Student added" });
    setEditingStudent(null);
    setStudentSectionId(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteStudent = () => {
    if (!deleteStudent) return;
    setSectionsData(prev => prev.map(section => {
      if (section.id !== deleteStudent.sectionId) return section;
      return { ...section, students: section.students.filter(s => s.id !== deleteStudent.studentId) };
    }));
    toast({ title: "Student removed" });
    setDeleteStudent(null);
    setHasUnsavedChanges(true);
  };

  // --- Faculty handlers ---
  const handleSaveFaculty = (data) => {
    if (editingFaculty) {
      setFacultyData(prev => prev.map(f => f.id === editingFaculty.id ? { ...f, ...data } : f));
      toast({ title: "Faculty updated" });
    } else {
      setFacultyData(prev => [...prev, { ...data, id: `f${Date.now()}` }]);
      toast({ title: "Faculty added" });
    }
    setEditingFaculty(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteFaculty = () => {
    if (deleteFacultyId) {
      setFacultyData(prev => prev.filter(f => f.id !== deleteFacultyId));
      toast({ title: "Faculty deleted" });
      setDeleteFacultyId(null);
      setHasUnsavedChanges(true);
    }
  };

  // Save all changes to backend
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const response = await axios.post('/api/sections/bulk_save/', {
        sections: sectionsData,
        faculty: facultyData,
      });
      if (response.data.success) {
        toast({ title: "Changes saved", description: "All changes have been saved to the database." });
        setHasUnsavedChanges(false);
        // Reload data from backend so IDs are synced with DB
        try {
          const reloadRes = await axios.get('/api/sections/load_all/');
          const { sections, faculty } = reloadRes.data;
          setSectionsData(sections.length > 0 ? sections : sectionsData);
          setFacultyData(faculty.length > 0 ? faculty : facultyData);
        } catch (e) {
          console.error('Failed to reload after save:', e);
        }
      }
    } catch (error) {
      toast({
        title: "Error saving changes",
        description: error.response?.data?.detail || "Failed to save changes.",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FFC20E]" />
            <p className="text-[#6B6B6B]">Loading classes...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              CLASS MANAGEMENT
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Classes & <span className="text-[#FFC20E]">Faculty Management</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6 sm:mb-8">
              Manage sections, students, and faculty assignments across all courses.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
              <button
                onClick={() => {
                  if (activeTab === "sections") {
                    setEditingSection(null);
                    setSectionDialog(true);
                  } else {
                    setEditingFaculty(null);
                    setFacultyDialog(true);
                  }
                }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                ADD {activeTab === "sections" ? "SECTION" : "FACULTY"}
              </button>

              <button
                onClick={handleSaveChanges}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-transparent text-white rounded-lg text-sm sm:text-base font-medium hover:bg-[#3A3A3A] transition-colors border border-[#A5A8AB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>

              <div className="flex items-center bg-[#3A3A3A] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("sections")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === "sections"
                      ? "bg-[#FFC20E] text-[#231F20]"
                      : "text-[#A5A8AB] hover:text-white"
                  }`}
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sections</span>
                </button>
                <button
                  onClick={() => setActiveTab("faculty")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    activeTab === "faculty"
                      ? "bg-[#FFC20E] text-[#231F20]"
                      : "text-[#A5A8AB] hover:text-white"
                  }`}
                >
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Faculty</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === "sections" && (
            <div className="space-y-4">
              {sectionsData.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-[#E5E7EB]">
                  <Users className="w-12 h-12 text-[#A5A8AB] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#231F20] mb-2">No Sections Yet</h3>
                  <p className="text-sm text-[#6B6B6B] mb-4">Get started by adding your first section.</p>
                  <button
                    onClick={() => { setEditingSection(null); setSectionDialog(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm font-medium hover:bg-[#FFC20E]/90"
                  >
                    <Plus className="w-4 h-4" /> Add Section
                  </button>
                </div>
              ) : (
                sectionsData.map((section) => {
                  // Derive faculty name from facultyData
                  const assignedFaculty = facultyData.find(f =>
                    f.courses.some(c =>
                      c.code === section.courseCode && c.sections.includes(section.name)
                    )
                  );
                  const sectionWithFaculty = {
                    ...section,
                    facultyName: assignedFaculty ? assignedFaculty.name : null,
                  };
                  return (
                    <SectionCard
                      key={section.id}
                      section={sectionWithFaculty}
                      onEdit={(s) => { setEditingSection(s); setSectionDialog(true); }}
                      onDelete={(id) => setDeleteSection(id)}
                      onAddStudent={handleAddStudent}
                      onEditStudent={handleEditStudent}
                      onDeleteStudent={(sectionId, studentId) => setDeleteStudent({ sectionId, studentId })}
                    />
                  );
                })
              )}
            </div>
          )}

          {activeTab === "faculty" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {facultyData.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-white rounded-lg border border-[#E5E7EB]">
                  <BookOpen className="w-12 h-12 text-[#A5A8AB] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#231F20] mb-2">No Faculty Members Yet</h3>
                  <p className="text-sm text-[#6B6B6B] mb-4">Get started by adding your first faculty member.</p>
                  <button
                    onClick={() => { setEditingFaculty(null); setFacultyDialog(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm font-medium hover:bg-[#FFC20E]/90"
                  >
                    <Plus className="w-4 h-4" /> Add Faculty
                  </button>
                </div>
              ) : (
                facultyData.map((f) => (
                  <FacultyCard
                    key={f.id}
                    faculty={f}
                    onEdit={(fac) => { setEditingFaculty(fac); setFacultyDialog(true); }}
                    onDelete={(id) => setDeleteFacultyId(id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Dialogs */}
      <SectionFormDialog
        open={sectionDialog}
        onClose={() => { setSectionDialog(false); setEditingSection(null); }}
        onSave={handleSaveSection}
        initialData={editingSection}
      />
      <StudentFormDialog
        open={studentDialog}
        onClose={() => { setStudentDialog(false); setEditingStudent(null); setStudentSectionId(null); }}
        onSave={handleSaveStudent}
        initialData={editingStudent}
      />
      <FacultyFormDialog
        open={facultyDialog}
        onClose={() => { setFacultyDialog(false); setEditingFaculty(null); }}
        onSave={handleSaveFaculty}
        initialData={editingFaculty}
        availableSections={sectionsData}
      />
      <DeleteConfirmDialog
        open={!!deleteSection}
        onClose={() => setDeleteSection(null)}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        description="Are you sure you want to delete this section? All students in this section will also be removed."
      />
      <DeleteConfirmDialog
        open={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        description="Are you sure you want to remove this student from the section?"
      />
      <DeleteConfirmDialog
        open={!!deleteFacultyId}
        onClose={() => setDeleteFacultyId(null)}
        onConfirm={handleDeleteFaculty}
        title="Delete Faculty"
        description="Are you sure you want to delete this faculty member?"
      />
    </div>
  );
};

export default Index;

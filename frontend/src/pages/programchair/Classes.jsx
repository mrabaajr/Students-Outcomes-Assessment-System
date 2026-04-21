import { useState, useEffect, useMemo, useRef } from "react";
import { BookOpen, Users, Plus, Settings, Loader2, Search, Filter, RotateCcw, AlertCircle, CheckCircle, X, TriangleAlert } from "lucide-react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/dashboard/Navbar";
import Footer from "@/components/dashboard/Footer";
import SectionCard from "@/components/classes/SectionCard";
import FacultyCard from "@/components/classes/FacultyCard";
import SectionFormDialog from "@/components/classes/SectionFormDialog";
import StudentFormDialog from "@/components/classes/StudentFormDialog";
import FacultyFormDialog from "@/components/classes/FacultyFormDialog";
import DeleteConfirmDialog from "@/components/classes/DeleteConfirmDialog";
import FacultyAccountModal from "@/components/accounts/FacultyAccountModal";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl === "faculty" ? "faculty" : "sections";
  const [sectionsData, setSectionsData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);
  const [deletedFacultyIds, setDeletedFacultyIds] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionSearch, setSectionSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedSectionStatus, setSelectedSectionStatus] = useState("All Statuses");
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("All School Years");
  const [selectedFaculty, setSelectedFaculty] = useState("All Faculty");
  const [selectedAssignmentStatus, setSelectedAssignmentStatus] = useState("All Sections");
  const [facultySearch, setFacultySearch] = useState("");
  const [selectedHandledCourse, setSelectedHandledCourse] = useState("All Courses");
  const autoSaveTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const setActiveTab = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab);
    setSearchParams(nextParams, { replace: true });
  };

  // Load data from backend on mount.
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/sections/load_all/`);
        const { sections, faculty } = response.data;
        setSectionsData(Array.isArray(sections) ? sections : []);
        setFacultyData(Array.isArray(faculty) ? faculty : []);
      } catch (error) {
        console.error("Failed to load classes from backend:", error);
        setSectionsData([]);
        setFacultyData([]);
        toast({
          title: "Unable to load classes",
          description: error.response?.data?.detail || "The classes page could not reach the backend.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
      hasLoadedRef.current = true;
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current || !hasUnsavedChanges || isSaving) {
      return undefined;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSaveChanges();
    }, 900);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, isSaving, sectionsData, facultyData, deletedFacultyIds]);

  const sectionFilterOptions = useMemo(() => {
    const courses = ["All Courses", ...new Set(sectionsData.map((section) => section.courseCode).filter(Boolean))];
    const semesters = ["All Semesters", ...new Set(sectionsData.map((section) => section.semester).filter(Boolean))];
    const schoolYears = ["All School Years", ...new Set(sectionsData.map((section) => section.schoolYear).filter(Boolean))];
    const facultyNames = [
      "All Faculty",
      ...new Set(
        sectionsData
          .map((section) => {
            const assignedFaculty = facultyData.find((faculty) =>
              faculty.courses.some(
                (course) => course.code === section.courseCode && course.sections.includes(section.name)
              )
            );
            return assignedFaculty?.name;
          })
          .filter(Boolean)
      ),
    ];

    return { courses, semesters, schoolYears, facultyNames };
  }, [sectionsData, facultyData]);

  const facultyCourseOptions = useMemo(() => {
    return [
      "All Courses",
      ...new Set(
        facultyData.flatMap((faculty) => faculty.courses.map((course) => course.code)).filter(Boolean)
      ),
    ];
  }, [facultyData]);

  const filteredSections = useMemo(() => {
    return sectionsData.filter((section) => {
      const assignedFaculty = facultyData.find((faculty) =>
        faculty.courses.some(
          (course) => course.code === section.courseCode && course.sections.includes(section.name)
        )
      );
      const facultyName = assignedFaculty?.name || "";
      const normalizedSearch = sectionSearch.trim().toLowerCase();
      const hasStudentMatch = section.students.some((student) =>
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.studentId.toLowerCase().includes(normalizedSearch)
      );

      const matchesSearch =
        normalizedSearch === "" ||
        section.name.toLowerCase().includes(normalizedSearch) ||
        section.courseCode.toLowerCase().includes(normalizedSearch) ||
        section.courseName.toLowerCase().includes(normalizedSearch) ||
        facultyName.toLowerCase().includes(normalizedSearch) ||
        hasStudentMatch;

      const matchesCourse = selectedCourse === "All Courses" || section.courseCode === selectedCourse;
      const matchesStatus =
        selectedSectionStatus === "All Statuses" ||
        (selectedSectionStatus === "Active" && section.isActive !== false) ||
        (selectedSectionStatus === "Inactive" && section.isActive === false);
      const matchesSemester = selectedSemester === "All Semesters" || section.semester === selectedSemester;
      const matchesSchoolYear =
        selectedSchoolYear === "All School Years" || section.schoolYear === selectedSchoolYear;
      const matchesFaculty = selectedFaculty === "All Faculty" || facultyName === selectedFaculty;
      const matchesAssignmentStatus =
        selectedAssignmentStatus === "All Sections" ||
        (selectedAssignmentStatus === "Assigned" && facultyName) ||
        (selectedAssignmentStatus === "Unassigned" && !facultyName);

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus &&
        matchesSemester &&
        matchesSchoolYear &&
        matchesFaculty &&
        matchesAssignmentStatus
      );
    });
  }, [sectionsData, facultyData, sectionSearch, selectedCourse, selectedSectionStatus, selectedSemester, selectedSchoolYear, selectedFaculty, selectedAssignmentStatus]);

  const filteredFaculty = useMemo(() => {
    return facultyData.filter((faculty) => {
      const normalizedSearch = facultySearch.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch === "" ||
        faculty.name.toLowerCase().includes(normalizedSearch) ||
        faculty.email.toLowerCase().includes(normalizedSearch) ||
        faculty.courses.some(
          (course) =>
            course.code.toLowerCase().includes(normalizedSearch) ||
            course.name.toLowerCase().includes(normalizedSearch) ||
            course.sections.some((section) => section.toLowerCase().includes(normalizedSearch))
        );

      const matchesHandledCourse =
        selectedHandledCourse === "All Courses" ||
        faculty.courses.some((course) => course.code === selectedHandledCourse);

      return matchesSearch && matchesHandledCourse;
    });
  }, [facultyData, facultySearch, selectedHandledCourse]);

  const resetSectionFilters = () => {
    setSectionSearch("");
    setSelectedCourse("All Courses");
    setSelectedSectionStatus("All Statuses");
    setSelectedSemester("All Semesters");
    setSelectedSchoolYear("All School Years");
    setSelectedFaculty("All Faculty");
    setSelectedAssignmentStatus("All Sections");
  };

  const resetFacultyFilters = () => {
    setFacultySearch("");
    setSelectedHandledCourse("All Courses");
  };

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
  const [facultyAccountModalOpen, setFacultyAccountModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deleteFacultyId, setDeleteFacultyId] = useState(null);

  const facultyPendingDelete = useMemo(
    () => facultyData.find((faculty) => faculty.id === deleteFacultyId) || null,
    [facultyData, deleteFacultyId]
  );

  const sectionsAffectedByFacultyDelete = useMemo(() => {
    if (!facultyPendingDelete) return [];

    return facultyPendingDelete.courses.flatMap((course) =>
      course.sections.map((sectionName) => ({
        key: `${course.code}-${sectionName}`,
        sectionName,
        courseCode: course.code,
        courseName: course.name,
      }))
    );
  }, [facultyPendingDelete]);

  // CSV Import
  const [importCSVModal, setImportCSVModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionName: null,
    loading: false,
    result: null,
    error: null,
  });
  const fileInputRef = useRef(null);

  // --- Section handlers ---
  const handleSaveSection = (data) => {
    const previousSectionName = editingSection?.name || "";
    const previousCourseCode = editingSection?.courseCode || "";
    const savedSection = editingSection
      ? {
          ...editingSection,
          ...data,
          isActive: data.isActive,
          semester: data.semester,
          academicYear: data.schoolYear,
        }
      : {
          ...data,
          id: Date.now().toString(),
          students: [],
          studentOutcomes: [],
          isActive: data.isActive,
          semester: data.semester,
          academicYear: data.schoolYear,
        };

    setSectionsData((prev) =>
      editingSection
        ? prev.map((section) => (section.id === editingSection.id ? savedSection : section))
        : [...prev, savedSection]
    );

    setFacultyData((prev) => {
      const targetFacultyEmail = (data.facultyEmail || "").trim().toLowerCase();

      return prev.map((faculty) => {
        const normalizedFacultyEmail = (faculty.email || "").trim().toLowerCase();
        const updatedCourses = faculty.courses
          .map((course) => {
            const isSameCourse = course.code === savedSection.courseCode;
            const filteredSections = course.sections.filter((sectionName) => {
              if (sectionName === savedSection.name) {
                return false;
              }

              if (
                previousSectionName &&
                previousCourseCode &&
                course.code === previousCourseCode &&
                sectionName === previousSectionName
              ) {
                return false;
              }

              return true;
            });

            if (normalizedFacultyEmail === targetFacultyEmail && isSameCourse) {
              return {
                ...course,
                sections: [...filteredSections, savedSection.name],
              };
            }

            return {
              ...course,
              sections: filteredSections,
            };
          })
          .filter((course) => course.sections.length > 0);

        if (
          normalizedFacultyEmail === targetFacultyEmail &&
          !updatedCourses.some((course) => course.code === savedSection.courseCode)
        ) {
          updatedCourses.push({
            code: savedSection.courseCode,
            name: savedSection.courseName,
            sections: [savedSection.name],
          });
        }

        return {
          ...faculty,
          courses: updatedCourses,
        };
      });
    });

    toast({
      title: editingSection ? "Section updated successfully" : "Section added successfully",
      description: "Section details will be saved automatically.",
    });
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
    const savedFaculty = editingFaculty
      ? { ...editingFaculty, ...data }
      : { ...data, id: `f${Date.now()}` };

    setFacultyData((prev) => {
      const nextFaculty = editingFaculty
        ? prev.map((faculty) => (faculty.id === editingFaculty.id ? savedFaculty : faculty))
        : [...prev, savedFaculty];

      const claimedSections = new Set(
        savedFaculty.courses.flatMap((course) =>
          course.sections.map((sectionName) => `${course.code}::${sectionName}`)
        )
      );

      return nextFaculty.map((faculty) => {
        if (faculty.id === savedFaculty.id) {
          return faculty;
        }

        return {
          ...faculty,
          courses: faculty.courses.map((course) => ({
            ...course,
            sections: course.sections.filter(
              (sectionName) => !claimedSections.has(`${course.code}::${sectionName}`)
            ),
          })),
        };
      });
    });

    toast({
      title: editingFaculty ? "Faculty updated" : "Faculty added",
      description: "Section assignments will be saved automatically.",
    });
    setEditingFaculty(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteFaculty = async () => {
    if (!deleteFacultyId) return;

    const deletingFacultyId = deleteFacultyId;
    setIsSaving(true);

    try {
      await axios.delete(`${API_BASE_URL}/users/${deletingFacultyId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setFacultyData((prev) => prev.filter((faculty) => faculty.id !== deletingFacultyId));
      setDeletedFacultyIds((prev) => prev.filter((id) => id !== deletingFacultyId));
      setDeleteFacultyId(null);
      toast({ title: "Faculty deleted", description: "The faculty account and section assignment links were removed." });
    } catch (error) {
      toast({
        title: "Error deleting faculty",
        description: error.response?.data?.detail || "Failed to delete faculty.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFacultyAccountCreated = (createdFaculty) => {
    setFacultyData((prev) => {
      const exists = prev.some((faculty) => faculty.email === createdFaculty.email);
      if (exists) {
        return prev;
      }
      return [...prev, createdFaculty];
    });
    setDeletedFacultyIds((prev) => prev.filter((id) => id !== createdFaculty.id));
    toast({ title: "Faculty account created" });
  };

  // --- CSV Import handlers ---
  const handleImportCSV = (sectionId) => {
    const section = sectionsData.find(s => s.id === sectionId);
    if (!section) return;
    
    setImportCSVModal({
      isOpen: true,
      sectionId,
      sectionName: section.name,
      loading: false,
      result: null,
      error: null,
    });
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setImportCSVModal((prev) => ({
        ...prev,
        error: "Please select a CSV file",
      }));
      return;
    }

    setImportCSVModal((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/sections/${importCSVModal.sectionId}/import-csv/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setImportCSVModal((prev) => ({
        ...prev,
        loading: false,
        result: {
          message: response.data.message,
          created: response.data.created || 0,
          updated: response.data.updated || 0,
          skipped: response.data.skipped || 0,
          errors: response.data.errors || [],
        },
      }));

      // Update local sections data with imported students
      if (response.data.created > 0 || response.data.updated > 0) {
        setHasUnsavedChanges(true);
        // Reload sections from backend to sync with database
        try {
          const reloadRes = await axios.get(`${API_BASE_URL}/sections/load_all/`);
          const { sections } = reloadRes.data;
          if (Array.isArray(sections)) {
            setSectionsData(sections);
          }
        } catch (e) {
          console.error('Failed to reload sections after import:', e);
        }
      }
    } catch (err) {
      setImportCSVModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.error || `Error: ${err.message}`,
      }));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeImportCSVModal = () => {
    setImportCSVModal({
      isOpen: false,
      sectionId: null,
      sectionName: null,
      loading: false,
      result: null,
      error: null,
    });
  };

  // Save all changes to backend
  const handleSaveChanges = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setIsSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/sections/bulk_save/`, {
        sections: sectionsData,
        faculty: facultyData,
        deletedFacultyIds,
      });
      if (response.data.success) {
        setHasUnsavedChanges(false);
        setDeletedFacultyIds([]);
        // Reload data from backend so IDs are synced with DB
        try {
          const reloadRes = await axios.get(`${API_BASE_URL}/sections/load_all/`);
          const { sections, faculty } = reloadRes.data;
          setSectionsData(Array.isArray(sections) ? sections : []);
          setFacultyData(Array.isArray(faculty) ? faculty : []);
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
                    setFacultyAccountModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                ADD {activeTab === "sections" ? "SECTION" : "FACULTY"}
              </button>

              <div className="flex items-center gap-2 rounded-lg border border-[#A5A8AB] px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>SAVING...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>CHANGES PENDING...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>AUTO-SAVED</span>
                  </>
                )}
              </div>

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
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5A8AB]" />
                      <input
                        value={sectionSearch}
                        onChange={(event) => setSectionSearch(event.target.value)}
                        placeholder="Section, course, faculty, or student"
                        className="w-full rounded-lg border border-[#D1D5DB] bg-white py-2.5 pl-10 pr-3 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                    <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                          <Filter className="h-3.5 w-3.5" />
                          Course
                        </label>
                        <select
                          value={selectedCourse}
                          onChange={(event) => setSelectedCourse(event.target.value)}
                          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                        >
                          {sectionFilterOptions.courses.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                          Status
                        </label>
                        <select
                          value={selectedSectionStatus}
                          onChange={(event) => setSelectedSectionStatus(event.target.value)}
                          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                        >
                          <option value="All Statuses">All Statuses</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                          Semester
                        </label>
                        <select
                          value={selectedSemester}
                          onChange={(event) => setSelectedSemester(event.target.value)}
                          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                        >
                          {sectionFilterOptions.semesters.map((semester) => (
                            <option key={semester} value={semester}>
                              {semester}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                          School Year
                        </label>
                        <select
                          value={selectedSchoolYear}
                          onChange={(event) => setSelectedSchoolYear(event.target.value)}
                          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                        >
                          {sectionFilterOptions.schoolYears.map((schoolYear) => (
                            <option key={schoolYear} value={schoolYear}>
                              {schoolYear}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                          Faculty
                        </label>
                        <select
                          value={selectedFaculty}
                          onChange={(event) => setSelectedFaculty(event.target.value)}
                          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                        >
                          {sectionFilterOptions.facultyNames.map((facultyName) => (
                            <option key={facultyName} value={facultyName}>
                              {facultyName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                          Assignment
                        </label>
                        <select
                          value={selectedAssignmentStatus}
                          onChange={(event) => setSelectedAssignmentStatus(event.target.value)}
                          className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                        >
                          <option value="All Sections">All Sections</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Unassigned">Unassigned</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={resetSectionFilters}
                      className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB] xl:self-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-sm text-[#6B6B6B]">
                  Showing <span className="font-semibold text-[#231F20]">{filteredSections.length}</span> of{" "}
                  <span className="font-semibold text-[#231F20]">{sectionsData.length}</span> sections
                </div>
              </div>

              {filteredSections.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-[#E5E7EB]">
                  <Users className="w-12 h-12 text-[#A5A8AB] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#231F20] mb-2">
                    {sectionsData.length === 0 ? "No Sections Yet" : "No Matching Sections"}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] mb-4">
                    {sectionsData.length === 0
                      ? "Get started by adding your first section."
                      : "Try adjusting or clearing your filters to see more results."}
                  </p>
                  {sectionsData.length === 0 ? (
                    <button
                      onClick={() => { setEditingSection(null); setSectionDialog(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm font-medium hover:bg-[#FFC20E]/90"
                    >
                      <Plus className="w-4 h-4" /> Add Section
                    </button>
                  ) : (
                    <button
                      onClick={resetSectionFilters}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#231F20] text-white rounded-lg text-sm font-medium hover:bg-[#3A3A3A]"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredSections.map((section) => {
                  // Derive faculty name from facultyData
                  const assignedFaculty = facultyData.find(f =>
                    f.courses.some(c =>
                      c.code === section.courseCode && c.sections.includes(section.name)
                    )
                  );
                  const sectionWithFaculty = {
                    ...section,
                    facultyName: assignedFaculty ? assignedFaculty.name : null,
                    facultyEmail: assignedFaculty ? assignedFaculty.email : "",
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
                      onImportCSV={handleImportCSV}
                    />
                  );
                })
              )}
            </div>
          )}

          {activeTab === "faculty" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                      <Search className="h-3.5 w-3.5" />
                      Search Faculty
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A5A8AB]" />
                      <input
                        value={facultySearch}
                        onChange={(event) => setFacultySearch(event.target.value)}
                        placeholder="Name, email, course, or section"
                        className="w-full rounded-lg border border-[#D1D5DB] bg-white py-2.5 pl-10 pr-3 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                      />
                    </div>
                  </div>

                  <div className="w-full lg:w-72">
                    <label className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                      Handled Course
                    </label>
                    <select
                      value={selectedHandledCourse}
                      onChange={(event) => setSelectedHandledCourse(event.target.value)}
                      className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                    >
                      {facultyCourseOptions.map((courseCode) => (
                        <option key={courseCode} value={courseCode}>
                          {courseCode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={resetFacultyFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>

                <div className="mt-4 text-sm text-[#6B6B6B]">
                  Showing <span className="font-semibold text-[#231F20]">{filteredFaculty.length}</span> of{" "}
                  <span className="font-semibold text-[#231F20]">{facultyData.length}</span> faculty members
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {filteredFaculty.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-lg border border-[#E5E7EB]">
                    <BookOpen className="w-12 h-12 text-[#A5A8AB] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#231F20] mb-2">
                      {facultyData.length === 0 ? "No Faculty Members Yet" : "No Matching Faculty"}
                    </h3>
                    <p className="text-sm text-[#6B6B6B] mb-4">
                      {facultyData.length === 0
                        ? "Get started by adding your first faculty member."
                        : "Try adjusting or clearing your filters to see more results."}
                    </p>
                    {facultyData.length === 0 ? (
                      <button
                        onClick={() => setFacultyAccountModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC20E] text-[#231F20] rounded-lg text-sm font-medium hover:bg-[#FFC20E]/90"
                      >
                        <Plus className="w-4 h-4" /> Add Faculty
                      </button>
                    ) : (
                      <button
                        onClick={resetFacultyFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#231F20] text-white rounded-lg text-sm font-medium hover:bg-[#3A3A3A]"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredFaculty.map((f) => (
                    <FacultyCard
                      key={f.id}
                      faculty={f}
                      onEdit={(fac) => { setEditingFaculty(fac); setFacultyDialog(true); }}
                      onDelete={(id) => setDeleteFacultyId(id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Dialogs */}
      <SectionFormDialog
        open={sectionDialog}
        onClose={() => { setSectionDialog(false); setEditingSection(null); }}
        onSave={handleSaveSection}
        initialData={editingSection}
        facultyOptions={facultyData}
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
        allFaculty={facultyData}
      />
      <FacultyAccountModal
        open={facultyAccountModalOpen}
        onClose={() => setFacultyAccountModalOpen(false)}
        onCreated={handleFacultyAccountCreated}
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
      >
        {sectionsAffectedByFacultyDelete.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  Warning: the following sections will have their faculty assignment removed.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sectionsAffectedByFacultyDelete.map((section) => (
                    <span
                      key={section.key}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200"
                    >
                      {section.sectionName} · {section.courseCode}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DeleteConfirmDialog>

      {/* CSV Import Modal */}
      {importCSVModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#231F20]">
                  Import Students to {importCSVModal.sectionName}
                </h2>
                <button
                  onClick={closeImportCSVModal}
                  className="text-[#6B6B6B] hover:text-[#231F20]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {importCSVModal.loading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC20E] mb-4"></div>
                  <p className="text-[#6B6B6B]">Processing CSV file...</p>
                </div>
              )}

              {importCSVModal.error && !importCSVModal.result && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-semibold">Import Failed</p>
                      <p className="text-red-700 text-sm mt-1">{importCSVModal.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {importCSVModal.result && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-semibold">{importCSVModal.result.message}</p>
                        <div className="text-green-700 text-sm mt-2 space-y-1">
                          <p>✓ Created: {importCSVModal.result.created} students</p>
                          <p>✓ Updated: {importCSVModal.result.updated} students</p>
                          {importCSVModal.result.skipped > 0 && (
                            <p>⊝ Skipped: {importCSVModal.result.skipped} rows</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {importCSVModal.result.errors && importCSVModal.result.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 font-semibold text-sm mb-2">Issues encountered:</p>
                      <ul className="text-yellow-700 text-xs space-y-1">
                        {importCSVModal.result.errors.slice(0, 5).map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                        {importCSVModal.result.errors.length > 5 && (
                          <li>• ... and {importCSVModal.result.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!importCSVModal.loading && !importCSVModal.result && !importCSVModal.error && (
                <div className="py-8">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="text-[#6B6B6B] text-4xl mb-3">📁</div>
                    <p className="text-[#231F20] font-semibold mb-1">Select a CSV file</p>
                    <p className="text-xs text-[#6B6B6B] mb-4">
                      Required columns: student_id, first_name, last_name, program, year_level
                    </p>
                    <button
                      onClick={handleChooseFile}
                      className="px-4 py-2 bg-[#FFC20E] text-[#231F20] text-sm font-medium rounded hover:bg-[#FFC20E]/90 transition"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                {importCSVModal.result && (
                  <button
                    onClick={closeImportCSVModal}
                    className="flex-1 px-4 py-2 bg-[#FFC20E] text-[#231F20] text-sm font-medium rounded hover:bg-[#FFC20E]/90 transition"
                  >
                    Close
                  </button>
                )}
                {!importCSVModal.loading && !importCSVModal.result && (
                  <button
                    onClick={closeImportCSVModal}
                    className="flex-1 px-4 py-2 bg-gray-200 text-[#231F20] text-sm font-medium rounded hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;

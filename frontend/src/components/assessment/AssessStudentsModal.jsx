import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Lightbulb,
  UsersRound,
  Save,
  ArrowLeft,
  PenTool,
  MessageSquare,
  Scale,
  FlaskConical,
  GripHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:8000/api";

const soIconList = [Lightbulb, PenTool, MessageSquare, Scale, UsersRound, FlaskConical];
const getSOIcon = (index) => soIconList[(index >= 0 ? index : 0) % soIconList.length];

const getFacultyForSection = (section, facultyData) => {
  const match = facultyData.find(faculty =>
    faculty.courses.some(course =>
      course.code === section.courseCode && course.sections.includes(section.name)
    )
  );
  return match?.name || "No faculty assigned";
};

export function AssessStudentsModal({
  isOpen,
  selectedSection,
  studentOutcomes,
  courseMappings,
  facultyData,
  selectedSOIds,
  onChangeSelectedSO,
  onClose,
  onCourseFiltersChange,
  onSaveSuccess,
}) {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [selectedAssessmentSO, setSelectedAssessmentSO] = useState(null);
  const [modalWidth, setModalWidth] = useState(85); // in vw
  const [modalHeight, setModalHeight] = useState(90); // in vh

  // Initialize students state from selectedSection
  useEffect(() => {
    if (selectedSection?.students && isOpen) {
      console.log("Modal opened/reloading, initializing students for section:", selectedSection.id);
      const initializedStudents = (selectedSection.students || []).map(student => ({
        ...student,
        grades: {},
      }));
      
      // Load any previously saved grades
      const courseSOs = courseMappings[selectedSection.courseCode] || [];
      const connectedSOs = studentOutcomes.filter(so =>
        courseSOs.some(soId => parseInt(soId) === so.id)
      );
      const selectedAssessmentSO = connectedSOs.length > 0 ? connectedSOs[0] : null;

      if (selectedAssessmentSO) {
        loadGrades(selectedSection.id, selectedAssessmentSO.id, selectedSection.schoolYear, initializedStudents, selectedSection.courseCode);
      } else {
        setStudents(initializedStudents);
        setSelectedAssessmentSO(null);
      }
    }
  }, [selectedSection?.id, isOpen]);

  // Reload grades when user switches between SO tabs
  useEffect(() => {
    if (selectedSection?.students && selectedSOIds.length > 0 && isOpen) {
      console.log("Selected SO changed to:", selectedSOIds[0]);
      const initializedStudents = (selectedSection.students || []).map(student => ({
        ...student,
        grades: {},
      }));
      loadGrades(selectedSection.id, selectedSOIds[0], selectedSection.schoolYear, initializedStudents, selectedSection.courseCode);
    }
  }, [selectedSOIds, selectedSection?.id, isOpen]);

  const loadGrades = async (sectionId, soId, schoolYear, initialStudents, courseCode) => {
    let resolvedSelectedSO = null;
    setIsLoadingAssessment(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assessments/load_grades/`,
        {
          params: {
            section_id: sectionId,
            so_id: soId,
            school_year: schoolYear,
          },
        }
      );
      const loadedGrades = response.data.grades || {};
      console.log("Loaded grades from backend:", loadedGrades);
      console.log("Backend response data:", response.data);
      
      // Fetch the full SO data directly from backend to ensure we have all criteria
      try {
        const soResponse = await axios.get(`${API_BASE_URL}/student-outcomes/${soId}/`);
        const soData = soResponse.data;
        console.log("Raw SO response from backend:", soData);
        
        resolvedSelectedSO = {
          id: soData.id,
          number: soData.number,
          code: `SO ${soData.number}`,
          title: soData.title,
          description: soData.description,
          performanceIndicators: (soData.performance_indicators || soData.performanceIndicators || []).map(pi => {
            console.log(`PI ${pi.id}:`, pi);
            const picList = (pi.criteria || pi.performanceCriteria || pi.performance_criteria || []);
            console.log(`  Criteria count: ${picList.length}`, picList);
            return {
              id: pi.id,
              number: pi.number,
              name: pi.description,
              performanceCriteria: picList.map(pc => ({
                id: pc.id,
                name: pc.name || '',
                order: pc.order ?? 0,
              })),
            };
          }),
        };
        console.log("Fetched full SO from backend:", resolvedSelectedSO);
      } catch (err) {
        console.warn("Could not fetch full SO data, falling back to local data:", err);
        // Fallback to local SO data if fetch fails
        const courseSOs = courseMappings[courseCode] || [];
        const connectedSOs = studentOutcomes.filter(so =>
          courseSOs.some(soId => parseInt(soId) === so.id)
        );
        resolvedSelectedSO = connectedSOs.find(s => s.id === soId) || connectedSOs[0];
      }
      
      const backendKeyToGradeKey = {};
      if (resolvedSelectedSO) {
        resolvedSelectedSO.performanceIndicators?.forEach(pi => {
          if (pi.performanceCriteria && pi.performanceCriteria.length > 0) {
            pi.performanceCriteria.forEach(pc => {
              backendKeyToGradeKey[`criterion:${pc.id}`] = `criterion:${pc.id}`;
            });
          } else {
            backendKeyToGradeKey[`indicator:${pi.id}`] = `indicator:${pi.id}`;
          }
        });
      }
      
      // Handle legacy backend payloads or unexpected keys gracefully.
      Object.keys(loadedGrades).forEach(studentId => {
        Object.keys(loadedGrades[studentId]).forEach(rawKey => {
          const normalizedKey = String(rawKey).includes(":")
            ? String(rawKey)
            : `criterion:${rawKey}`;

          if (!backendKeyToGradeKey[normalizedKey]) {
            console.warn(`Assessment basis ${normalizedKey} not found in SO structure, using raw key as fallback`);
            backendKeyToGradeKey[normalizedKey] = normalizedKey;
          }
        });
      });
      
      console.log("Assessment basis mapping:", backendKeyToGradeKey);
      
      // Transform loaded grades into local grade keys.
      const transformedGrades = {};
      Object.entries(loadedGrades).forEach(([studentId, criteria]) => {
        transformedGrades[studentId] = {};
        Object.entries(criteria).forEach(([rawKey, score]) => {
          const normalizedKey = String(rawKey).includes(":")
            ? String(rawKey)
            : `criterion:${rawKey}`;
          const gradeKey = backendKeyToGradeKey[normalizedKey];
          console.log(`Student ${studentId}: basis ${normalizedKey} -> local ${gradeKey}, score=${score}`);
          if (gradeKey) {
            transformedGrades[studentId][gradeKey] = score;
          }
        });
      });
      console.log("Transformed grades after mapping:", transformedGrades);
      
      const updatedStudents = initialStudents.map(student => ({
        ...student,
        grades: {
          ...student.grades,
          ...transformedGrades[student.id],
        },
      }));
      console.log("Updated students with loaded grades:", updatedStudents);
      updatedStudents.forEach(s => {
        console.log(`  Student ${s.id} final grades:`, s.grades);
        Object.entries(s.grades).forEach(([key, val]) => {
          console.log(`    ${key} = ${val}`);
        });
      });      
      // Save the fetched SO data to state so the UI uses correct criteria
      setSelectedAssessmentSO(resolvedSelectedSO);
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error loading grades:", error);
      // Still set the SO even if grade loading failed, so UI shows correct structure
      if (resolvedSelectedSO) {
        setSelectedAssessmentSO(resolvedSelectedSO);
      }
      setStudents(initialStudents);
    } finally {
      setIsLoadingAssessment(false);
    }
  };

  // Handle resize start
  const handleResizeMouseDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidthCurrent = modalWidth;
    const startHeightCurrent = modalHeight;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newWidth = startWidthCurrent + (deltaX / window.innerWidth) * 100;
      const newHeight = startHeightCurrent + (deltaY / window.innerHeight) * 100;

      setModalWidth(Math.max(50, Math.min(95, newWidth)));
      setModalHeight(Math.max(50, Math.min(95, newHeight)));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle resize start for touch devices
  const handleResizeTouchStart = (e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startWidthCurrent = modalWidth;
    const startHeightCurrent = modalHeight;

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      const newWidth = startWidthCurrent + (deltaX / window.innerWidth) * 100;
      const newHeight = startHeightCurrent + (deltaY / window.innerHeight) * 100;

      setModalWidth(Math.max(50, Math.min(95, newWidth)));
      setModalHeight(Math.max(50, Math.min(95, newHeight)));
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleGradeChange = (studentId, criterionKey, value) => {
    setStudents(students.map(student =>
      student.id === studentId
        ? {
            ...student,
            grades: {
              ...student.grades,
              [criterionKey]: value,
            },
          }
        : student
    ));
  };

  const handleSave = async () => {
    console.log("Save Assessment button clicked");
    console.log("selectedSection:", selectedSection);
    console.log("selectedSOIds:", selectedSOIds);
    
    if (!selectedSection) {
      console.log("No section selected");
      toast({
        description: "No section selected",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const courseSOs = courseMappings[selectedSection.courseCode] || [];
    console.log("courseSOs:", courseSOs);
    
    const connectedSOs = studentOutcomes.filter(so =>
      courseSOs.some(soId => parseInt(soId) === so.id)
    );
    console.log("connectedSOs:", connectedSOs);
    
    const selectedAssessmentSO = connectedSOs.find(s =>
      selectedSOIds.length > 0 && s.id === selectedSOIds[0]
    ) || connectedSOs[0];

    console.log("selectedAssessmentSO:", selectedAssessmentSO);

    if (!selectedAssessmentSO) {
      console.log("No Student Outcome selected");
      toast({
        description: "Please select a Student Outcome first",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Transform grades into backend basis keys.
    const gradesPayload = {};

    const validBases = new Set();
    if (selectedAssessmentSO) {
      selectedAssessmentSO.performanceIndicators?.forEach(pi => {
        if (pi.performanceCriteria && pi.performanceCriteria.length > 0) {
          pi.performanceCriteria.forEach(pc => {
            validBases.add(`criterion:${pc.id}`);
          });
        } else {
          validBases.add(`indicator:${pi.id}`);
        }
      });
    }
    console.log("Valid assessment bases for SO ", selectedAssessmentSO.id, ":", [...validBases]);
    
    students.forEach(student => {
      gradesPayload[student.id] = {};
      console.log(`Processing student ${student.id}:`, student.grades);
      
      Object.entries(student.grades).forEach(([gradeKey, score]) => {
        if (score !== null && score !== undefined && score !== "") {
          if (!validBases.has(gradeKey)) {
            console.warn(`  Skipping unsupported basis ${gradeKey} for SO ${selectedAssessmentSO.id}`);
            return;
          }

          gradesPayload[student.id][gradeKey] = score;
          console.log(`  Added: ${gradeKey} = ${score}`);
        }
      });
    });

    console.log("Final gradesPayload:", gradesPayload);

    const gradedStudentsCount = Object.values(gradesPayload).filter((criteriaGrades) =>
      Object.values(criteriaGrades).some((score) => score !== null && score !== undefined && score !== "")
    ).length;
    const totalStudents = students.length;
    const sectionStatus =
      totalStudents === 0 || gradedStudentsCount === 0
        ? "not-yet"
        : gradedStudentsCount === totalStudents
          ? "assessed"
          : "incomplete";

    setIsSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/assessments/save_grades/`, {
        section_id: selectedSection.id,
        so_id: selectedAssessmentSO.id,
        school_year: selectedSection.schoolYear,
        grades: gradesPayload,
      });

      console.log("Save response:", response);
      toast({
        description: "Assessment saved successfully!",
        duration: 2000,
      });
      
      // Call the success callback to refresh parent state
      if (onSaveSuccess) {
        onSaveSuccess({
          sectionId: selectedSection.id,
          courseCode: selectedSection.courseCode,
          soId: selectedAssessmentSO.id,
          sectionStatus,
        });
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error saving assessment:", error);
      console.error("Error response:", error.response?.data);
      toast({
        description: error.response?.data?.detail || "Failed to save assessment",
        variant: "destructive",
        duration: 2000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedSection) return null;

  const courseSOs = courseMappings[selectedSection.courseCode] || [];
  const connectedSOs = studentOutcomes.filter(so =>
    courseSOs.some(soId => parseInt(soId) === so.id)
  );
  // Use the state variable selectedAssessmentSO which is populated from backend data with correct criteria
  // This ensures we display only the criteria that belong to the selected SO
  const displayIndicators = selectedAssessmentSO?.performanceIndicators || [];
  const indicatorsWithoutCriteria = displayIndicators.filter(
    (pi) => !pi.performanceCriteria || pi.performanceCriteria.length === 0
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <style>{`
        .assessment-table-container {
          position: relative;
          overflow-x: scroll !important;
          overflow-y: hidden !important;
        }
        .assessment-table-container::-webkit-scrollbar {
          height: 10px !important;
        }
        .assessment-table-container::-webkit-scrollbar-track {
          background: #e5e5e5;
          border-radius: 4px;
        }
        .assessment-table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
          min-width: 40px;
        }
        .assessment-table-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .assessment-table-container {
          scrollbar-width: auto;
          scrollbar-color: #888 #e5e5e5;
        }
      `}</style>
      <DialogContent 
        className="flex flex-col overflow-hidden bg-white relative"
        style={{
          width: `${modalWidth}vw`,
          height: `${modalHeight}vh`,
          maxWidth: 'none',
          maxHeight: 'none',
          position: 'fixed',
        }}
      >
        <DialogHeader className="flex-shrink-0 flex items-start justify-between pr-4">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#FFC20E]/10 rounded-lg transition-colors text-[#231F20]"
              title="Back to sections"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                Assess Students — {selectedSection?.name}
              </DialogTitle>
              <DialogDescription>
                Review section details, select a Student Outcome, and assess students
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-4">
          {/* Section Details Header */}
          <div className="bg-gradient-to-r from-[#FFC20E]/10 to-[#FFC20E]/5 border border-[#FFC20E] rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider mb-1">Section Name</span>
                <p className="font-bold text-lg text-[#231F20]">{selectedSection.name}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider mb-1">Course Name</span>
                <p className="font-bold text-lg text-[#231F20]">{selectedSection.courseName}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider mb-1">No. of Students</span>
                <p className="font-bold text-lg text-[#231F20]">{selectedSection.students?.length || 0}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-[#6B6B6B] text-xs font-semibold uppercase tracking-wider mb-1">Faculty Handled</span>
                <p className="font-bold text-lg text-[#231F20]">{getFacultyForSection(selectedSection, facultyData)}</p>
              </div>
            </div>
          </div>

          {/* SO Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#231F20] mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#FFC20E]" />
                Select a Student Outcome to Assess
              </h3>
              <div className="text-xs text-[#6B6B6B] mb-3">
                Showing Student Outcomes connected to <span className="font-semibold text-[#231F20]">{selectedSection.courseCode}</span> course
              </div>

              {connectedSOs.length > 0 ? (
                <>
                  {/* SO Tabs/Buttons */}
                  <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
                    {connectedSOs.map((outcome, idx) => {
                      const Icon = getSOIcon(idx);
                      const isSelected = selectedSOIds.length > 0 && outcome.id === selectedSOIds[0];

                      return (
                        <button
                          key={outcome.id}
                          onClick={() => onChangeSelectedSO([outcome.id])}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border",
                            isSelected
                              ? "bg-[#FFC20E] text-[#231F20] border-[#FFC20E] shadow-md"
                              : "bg-white text-[#6B6B6B] border-[#E5E7EB] hover:border-[#FFC20E] hover:text-[#231F20]"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{outcome.code}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SO Details Card */}
                  {selectedAssessmentSO && (
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-[#231F20] flex items-center justify-center text-[#FFC20E] font-bold text-sm">
                            {selectedAssessmentSO.number}
                          </div>
                          <div>
                            <h4 className="font-bold text-[#231F20]">{selectedAssessmentSO.title}</h4>
                            <p className="text-xs text-[#6B6B6B]">{selectedAssessmentSO.code}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[#6B6B6B] leading-relaxed">{selectedAssessmentSO.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Students Assessment Table */}
                  {isLoadingAssessment && (
                    <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-4 animate-pulse">
                      <div className="space-y-2">
                        <div className="h-5 w-44 rounded bg-[#E5E7EB]" />
                        <div className="h-3 w-72 rounded bg-[#F1F5F9]" />
                      </div>
                      <div className="rounded-lg border border-[#D1D5DB] bg-white p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="h-10 rounded bg-[#E5E7EB]" />
                          <div className="h-10 rounded bg-[#E5E7EB]" />
                          <div className="h-10 rounded bg-[#E5E7EB]" />
                          <div className="h-10 rounded bg-[#E5E7EB]" />
                        </div>
                        {Array.from({ length: 4 }).map((_, rowIndex) => (
                          <div key={`assessment-loading-row-${rowIndex}`} className="grid grid-cols-4 gap-3">
                            <div className="h-10 rounded bg-[#F3F4F6]" />
                            <div className="h-10 rounded bg-[#F9FAFB]" />
                            <div className="h-10 rounded bg-[#F9FAFB]" />
                            <div className="h-10 rounded bg-[#F9FAFB]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isLoadingAssessment && selectedAssessmentSO && students.length > 0 && displayIndicators.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3">
                      <div>
                        <h4 className="text-base font-semibold text-[#231F20] mb-3 flex items-center gap-2">
                          <UsersRound className="w-5 h-5 text-[#FFC20E]" />
                          Assess Students — {selectedAssessmentSO.code}
                        </h4>
                        <p className="text-xs text-[#6B6B6B] mb-3">
                          Rate each student's performance for each criterion or performance indicator (1-6 scale, where 6 is highest)
                        </p>
                        {indicatorsWithoutCriteria > 0 && (
                          <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                            {indicatorsWithoutCriteria} performance indicator{indicatorsWithoutCriteria > 1 ? "s use" : " uses"} the performance indicator itself as the grading basis because no criteria are defined yet.
                          </div>
                        )}
                      </div>

                      <div
                        className="assessment-table-container rounded-lg border border-[#D1D5DB] bg-white shadow-sm"
                        style={{ minHeight: '300px', display: 'block', overflow: 'auto' }}
                      >
                        <table
                          className="border-collapse text-sm"
                          style={{
                            width: `${Math.max(260 + displayIndicators.reduce((sum, pi) => sum + Math.max(pi.performanceCriteria?.length || 1, 1) * 110, 0), 800)}px`,
                            minWidth: 'calc(100% + 20px)'
                          }}
                        >
                          <thead>
                            {/* Row 1: Performance Indicator Headers */}
                            <tr className="bg-gradient-to-r from-[#231F20] to-[#3A3A3A]">
                              <th
                                colSpan={2}
                                className="border-r border-[#D1D5DB] px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-white min-w-[260px] bg-gradient-to-r from-[#231F20] to-[#3A3A3A]"
                                style={{position: 'sticky', left: 0, zIndex: 20}}
                              >
                                Student
                              </th>
                              <th
                                colSpan={displayIndicators.reduce((sum, pi) => sum + Math.max(pi.performanceCriteria?.length || 1, 1), 0)}
                                className="border-r border-[#D1D5DB] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white last:border-r-0"
                              >
                                Performance Indicators
                              </th>
                            </tr>

                            {/* Row 2: PI Names */}
                            <tr className="bg-[#F5F5F5] border-b border-[#E5E7EB]">
                              <th
                                colSpan={2}
                                className="border-r border-[#D1D5DB] px-4 py-2.5 text-left text-xs font-semibold text-[#231F20] bg-[#F5F5F5]"
                                style={{position: 'sticky', left: 0, zIndex: 20}}
                              >
                                No. / Name
                              </th>
                              {displayIndicators.map((pi) => {
                                return (
                                  <td
                                    key={`pi-name-${pi.id}`}
                                    colSpan={Math.max(pi.performanceCriteria?.length || 0, 1)}
                                    className="border-r border-[#E5E7EB] px-2 py-2.5 text-center text-xs font-semibold text-[#231F20] bg-[#F5F5F5] align-middle last:border-r-0 leading-tight"
                                    style={{ minWidth: `${Math.max(pi.performanceCriteria?.length || 0, 1) * 110}px` }}
                                  >
                                    {pi.name}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 3: Performance Criteria */}
                            {displayIndicators.length > 0 && (
                              <tr className="bg-[#FFF8DB] border-b border-[#E5E7EB]">
                                <th
                                  colSpan={2}
                                  className="border-r border-[#D1D5DB] px-4 py-2 text-left text-xs font-semibold text-[#6B6B6B] bg-[#FFF8DB]"
                                  style={{position: 'sticky', left: 0, zIndex: 20}}
                                >
                                  Criteria
                                </th>
                                {displayIndicators.map((pi) => {
                                  if (!pi.performanceCriteria || pi.performanceCriteria.length === 0) {
                                    return (
                                      <th
                                        key={`pc-${pi.id}-indicator`}
                                        className="min-w-[110px] border-r border-[#E5E7EB] px-2 py-2 text-center text-xs italic text-[#6B6B6B] bg-[#FFF8DB] last:border-r-0 leading-tight"
                                      >
                                        No criteria
                                      </th>
                                    );
                                  }

                                  return pi.performanceCriteria.map((pc) => (
                                    <th
                                      key={`pc-${pi.id}-${pc.id}`}
                                      className="min-w-[110px] border-r border-[#E5E7EB] px-2 py-2 text-center text-xs font-semibold text-[#231F20] bg-[#FFF8DB] last:border-r-0 leading-tight"
                                    >
                                      {pc.name}
                                    </th>
                                  ));
                                })}
                              </tr>
                            )}
                          </thead>

                          <tbody>
                            {students.map((student, idx) => (
                              <tr key={student.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#FFC20E]/5 transition-colors">
                                <td className="border-r border-[#E5E7EB] px-4 py-2.5 text-center text-sm font-bold text-white bg-[#231F20] min-w-[50px]" style={{position: 'sticky', left: 0, zIndex: 15}}>
                                  {idx + 1}
                                </td>
                                <td className="border-r border-[#E5E7EB] px-4 py-2.5 text-sm bg-[#F9F9F9] min-w-[210px]" style={{position: 'sticky', left: '50px', zIndex: 15}}>
                                  <p className="font-semibold text-[#231F20]">{student.name}</p>
                                  <p className="text-xs text-[#6B6B6B] mt-1">{student.studentId}</p>
                                </td>
                                {displayIndicators.map((pi) => {
                                  if (!pi.performanceCriteria || pi.performanceCriteria.length === 0) {
                                    return (
                                      <td
                                        key={`grade-${student.id}-${pi.id}-indicator`}
                                        className="border-r border-[#E5E7EB] px-2 py-2 text-center min-w-[110px] last:border-r-0"
                                      >
                                        <select
                                          id={`grade-${student.id}-${pi.id}-indicator`}
                                          name={`grade-${student.id}-${pi.id}-indicator`}
                                          value={students.find(s => s.id === student.id)?.grades?.[`indicator:${pi.id}`] ?? ""}
                                          onChange={(e) => handleGradeChange(student.id, `indicator:${pi.id}`, e.target.value ? parseInt(e.target.value) : null)}
                                          className="w-full px-2 py-1.5 rounded border border-[#D1D5DB] text-sm font-semibold text-[#231F20] focus:border-[#FFC20E] focus:ring-2 focus:ring-[#FFC20E]/30 bg-white cursor-pointer transition-all hover:border-[#FFC20E]"
                                        >
                                          <option value="">-</option>
                                          <option value="1">1</option>
                                          <option value="2">2</option>
                                          <option value="3">3</option>
                                          <option value="4">4</option>
                                          <option value="5">5</option>
                                          <option value="6">6</option>
                                        </select>
                                      </td>
                                    );
                                  }

                                  return pi.performanceCriteria.map((pc) => (
                                    <td
                                      key={`grade-${student.id}-${pi.id}-${pc.id}`}
                                      className="border-r border-[#E5E7EB] px-2 py-2 text-center min-w-[110px] last:border-r-0"
                                    >
                                      <select
                                        id={`grade-${student.id}-${pi.id}-${pc.id}`}
                                        name={`grade-${student.id}-${pi.id}-${pc.id}`}
                                        value={students.find(s => s.id === student.id)?.grades?.[`criterion:${pc.id}`] ?? ""}
                                        onChange={(e) => handleGradeChange(student.id, `criterion:${pc.id}`, e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-2 py-1.5 rounded border border-[#D1D5DB] text-sm font-semibold text-[#231F20] focus:border-[#FFC20E] focus:ring-2 focus:ring-[#FFC20E]/30 bg-white cursor-pointer transition-all hover:border-[#FFC20E]"
                                        >
                                          <option value="">-</option>
                                          <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                      </select>
                                    </td>
                                  ));
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-3">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#FFC20E] text-[#231F20] rounded-lg font-semibold hover:bg-[#FFC20E]/90 disabled:opacity-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Saving...' : 'Save Assessment'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-[#6B6B6B]/40 mx-auto mb-3" />
                  <p className="text-sm text-[#6B6B6B]">
                    No Student Outcomes are currently mapped to this course.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-[#FFC20E]/30 transition-colors user-select-none"
          style={{
            background: 'linear-gradient(135deg, transparent 50%, #FFC20E 50%)',
            opacity: 0.6,
            zIndex: 50,
          }}
          title="Drag to resize modal"
        />
      </DialogContent>
    </Dialog>
  );
}


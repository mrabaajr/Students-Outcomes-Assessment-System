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
}) {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [modalWidth, setModalWidth] = useState(85); // in vw
  const [modalHeight, setModalHeight] = useState(90); // in vh

  // Initialize students state from selectedSection
  useEffect(() => {
    if (selectedSection?.students) {
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
        loadGrades(selectedSection.id, selectedAssessmentSO.id, selectedSection.schoolYear, initializedStudents);
      } else {
        setStudents(initializedStudents);
      }
    }
  }, [selectedSection?.id]);

  const loadGrades = async (sectionId, soId, schoolYear, initialStudents) => {
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
      const updatedStudents = initialStudents.map(student => ({
        ...student,
        grades: {
          ...student.grades,
          ...loadedGrades[student.id],
        },
      }));
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error loading grades:", error);
      setStudents(initialStudents);
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
    if (!selectedSection) return;

    const courseSOs = courseMappings[selectedSection.courseCode] || [];
    const connectedSOs = studentOutcomes.filter(so =>
      courseSOs.some(soId => parseInt(soId) === so.id)
    );
    const selectedAssessmentSO = connectedSOs.find(s =>
      selectedSOIds.length > 0 && s.id === selectedSOIds[0]
    ) || connectedSOs[0];

    if (!selectedAssessmentSO) return;

    const gradesPayload = {};
    students.forEach(student => {
      gradesPayload[student.id] = student.grades;
    });

    setIsSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/assessments/save_grades/`, {
        section_id: selectedSection.id,
        so_id: selectedAssessmentSO.id,
        school_year: selectedSection.schoolYear,
        grades: gradesPayload,
      });

      toast({
        description: "Assessment saved successfully!",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({
        description: "Failed to save assessment",
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
  const selectedAssessmentSO = connectedSOs.find(s =>
    selectedSOIds.length > 0 && s.id === selectedSOIds[0]
  ) || connectedSOs[0];

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
                  {selectedAssessmentSO && students.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3">
                      <div>
                        <h4 className="text-base font-semibold text-[#231F20] mb-3 flex items-center gap-2">
                          <UsersRound className="w-5 h-5 text-[#FFC20E]" />
                          Assess Students — {selectedAssessmentSO.code}
                        </h4>
                        <p className="text-xs text-[#6B6B6B] mb-3">
                          Rate each student's performance for each criterion (1-6 scale, where 6 is highest)
                        </p>
                      </div>

                      <div
                        className="assessment-table-container rounded-lg border border-[#D1D5DB] bg-white shadow-sm"
                        style={{ minHeight: '300px', display: 'block', overflow: 'auto' }}
                      >
                        <table
                          className="border-collapse text-sm"
                          style={{
                            width: `${Math.max(260 + selectedAssessmentSO.performanceIndicators.reduce((sum, pi) => sum + Math.max(pi.performanceCriteria?.length || 1, 1) * 110, 0), 800)}px`,
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
                                colSpan={selectedAssessmentSO.performanceIndicators.reduce((sum, pi) => sum + Math.max(pi.performanceCriteria?.length || 1, 1), 0)}
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
                              {selectedAssessmentSO.performanceIndicators.map((pi) => (
                                <td
                                  key={`pi-name-${pi.id}`}
                                  colSpan={Math.max(pi.performanceCriteria?.length || 1, 1)}
                                  className="border-r border-[#E5E7EB] px-2 py-2.5 text-center text-xs font-semibold text-[#231F20] bg-[#F5F5F5] align-middle last:border-r-0 leading-tight"
                                  style={{ minWidth: `${Math.max(pi.performanceCriteria?.length || 1, 1) * 110}px` }}
                                >
                                  {pi.name}
                                </td>
                              ))}
                            </tr>

                            {/* Row 3: Performance Criteria */}
                            {selectedAssessmentSO.performanceIndicators.some(pi => pi.performanceCriteria && pi.performanceCriteria.length > 0) && (
                              <tr className="bg-[#FFF8DB] border-b border-[#E5E7EB]">
                                <th
                                  colSpan={2}
                                  className="border-r border-[#D1D5DB] px-4 py-2 text-left text-xs font-semibold text-[#6B6B6B] bg-[#FFF8DB]"
                                  style={{position: 'sticky', left: 0, zIndex: 20}}
                                >
                                  Criteria
                                </th>
                                {selectedAssessmentSO.performanceIndicators.map((pi) =>
                                  (pi.performanceCriteria && pi.performanceCriteria.length > 0) ? (
                                    pi.performanceCriteria.map((pc) => (
                                      <th
                                        key={`pc-${pi.id}-${pc.id}`}
                                        className="min-w-[110px] border-r border-[#E5E7EB] px-2 py-2 text-center text-xs font-semibold text-[#231F20] bg-[#FFF8DB] last:border-r-0 leading-tight"
                                      >
                                        {pc.name}
                                      </th>
                                    ))
                                  ) : (
                                    <th
                                      key={`pc-${pi.id}-empty`}
                                      colSpan={1}
                                      className="min-w-[110px] border-r border-[#E5E7EB] px-2 py-2 last:border-r-0 bg-[#FFF8DB]"
                                    >
                                    </th>
                                  )
                                )}
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
                                {selectedAssessmentSO.performanceIndicators.map((pi) =>
                                  (pi.performanceCriteria && pi.performanceCriteria.length > 0) ? (
                                    pi.performanceCriteria.map((pc) => (
                                      <td
                                        key={`grade-${student.id}-${pi.id}-${pc.id}`}
                                        className="border-r border-[#E5E7EB] px-2 py-2 text-center min-w-[110px] last:border-r-0"
                                      >
                                        <select
                                          id={`grade-${student.id}-${pi.id}-${pc.id}`}
                                          name={`grade-${student.id}-${pi.id}-${pc.id}`}
                                          value={students.find(s => s.id === student.id)?.grades?.[`${pi.id}-${pc.id}`] ?? ""}
                                          onChange={(e) => handleGradeChange(student.id, `${pi.id}-${pc.id}`, e.target.value ? parseInt(e.target.value) : null)}
                                          className="w-full px-2 py-1.5 rounded border border-[#D1D5DB] text-sm font-semibold text-[#231F20] focus:border-[#FFC20E] focus:ring-2 focus:ring-[#FFC20E]/30 bg-white cursor-pointer transition-all hover:border-[#FFC20E]"
                                        >
                                          <option value="">—</option>
                                          <option value="1">1</option>
                                          <option value="2">2</option>
                                          <option value="3">3</option>
                                          <option value="4">4</option>
                                          <option value="5">5</option>
                                          <option value="6">6</option>
                                        </select>
                                      </td>
                                    ))
                                  ) : (
                                    <td
                                      key={`grade-${student.id}-${pi.id}-empty`}
                                      className="border-r border-[#E5E7EB] px-2 py-2 text-center min-w-[110px] last:border-r-0"
                                    >
                                      <select
                                        id={`grade-${student.id}-${pi.id}-empty`}
                                        name={`grade-${student.id}-${pi.id}`}
                                        value={students.find(s => s.id === student.id)?.grades?.[`${pi.id}-empty`] ?? ""}
                                        onChange={(e) => handleGradeChange(student.id, `${pi.id}-empty`, e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full px-2 py-1.5 rounded border border-[#D1D5DB] text-sm font-semibold text-[#231F20] focus:border-[#FFC20E] focus:ring-2 focus:ring-[#FFC20E]/30 bg-white cursor-pointer transition-all hover:border-[#FFC20E]"
                                      >
                                        <option value="">—</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                      </select>
                                    </td>
                                  )
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-3">
                        <button
                          onClick={() => {
                            handleSave();
                            onClose();
                          }}
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

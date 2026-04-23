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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Lightbulb,
  UsersRound,
  Save,
  ArrowLeft,
  Eraser,
  Printer,
  PenTool,
  MessageSquare,
  Scale,
  FlaskConical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { API_BASE_URL, getAuthHeader } from "@/lib/api";

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

const buildAssessmentBases = (studentOutcome) => {
  if (!studentOutcome?.performanceIndicators) {
    return [];
  }

  return studentOutcome.performanceIndicators.flatMap((pi) => {
    if (pi.performanceCriteria && pi.performanceCriteria.length > 0) {
      return pi.performanceCriteria.map((pc) => ({
        key: `criterion:${pc.id}`,
        label: pc.name || pi.name || "Unnamed sub performance indicator",
      }));
    }

    return [
      {
        key: `indicator:${pi.id}`,
        label: pi.name || "Unnamed performance indicator",
      },
    ];
  });
};

export function StudentRubricModal({
  isOpen,
  selectedSection,
  selectedStudent,
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
  const [missingGradeMap, setMissingGradeMap] = useState({});
  const [modalWidth, setModalWidth] = useState(95); // in vw
  const [modalHeight, setModalHeight] = useState(96); // in vh
  const [statusPopup, setStatusPopup] = useState({
    open: false,
    title: "",
    description: "",
    sectionStatus: null,
  });
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const latestStudentsRef = useRef([]);
  const lastSavedSignatureRef = useRef("");
  const rubricSheetRef = useRef(null);

  const getActiveSOId = (selectedSOOverride = selectedAssessmentSO) => {
    if (selectedSOOverride?.id) {
      return selectedSOOverride.id;
    }

    const normalizedSelectedSOId = selectedSOIds.length > 0
      ? parseInt(selectedSOIds[0], 10)
      : null;

    return Number.isInteger(normalizedSelectedSOId) ? normalizedSelectedSOId : null;
  };

  const getDraftStorageKey = (sectionId, soId, schoolYear) => {
    if (!sectionId || !soId) {
      return null;
    }

    return `assessment-draft:${sectionId}:${soId}:${schoolYear || "unknown"}`;
  };

  const readDraftGrades = (sectionId, soId, schoolYear) => {
    const storageKey = getDraftStorageKey(sectionId, soId, schoolYear);
    if (!storageKey) {
      return null;
    }

    try {
      const rawDraft = window.localStorage.getItem(storageKey);
      if (!rawDraft) {
        return null;
      }

      const parsedDraft = JSON.parse(rawDraft);
      return parsedDraft?.gradesByStudent || null;
    } catch (error) {
      console.warn("Failed to read local assessment draft:", error);
      return null;
    }
  };

  const writeDraftGrades = (sectionId, soId, schoolYear, studentList) => {
    const storageKey = getDraftStorageKey(sectionId, soId, schoolYear);
    if (!storageKey) {
      return;
    }

    try {
      const gradesByStudent = studentList.reduce((accumulator, student) => {
        accumulator[student.id] = student.grades || {};
        return accumulator;
      }, {});

      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          gradesByStudent,
        })
      );
    } catch (error) {
      console.warn("Failed to write local assessment draft:", error);
    }
  };

  const clearDraftGrades = (sectionId, soId, schoolYear) => {
    const storageKey = getDraftStorageKey(sectionId, soId, schoolYear);
    if (!storageKey) {
      return;
    }

    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("Failed to clear local assessment draft:", error);
    }
  };

  const createSaveSignature = ({ sectionId, soId, schoolYear, grades }) =>
    JSON.stringify({
      sectionId,
      soId,
      schoolYear: schoolYear || "",
      grades,
    });

  const buildSaveContext = (studentList, selectedSOOverride = selectedAssessmentSO) => {
    if (!selectedSection) {
      return null;
    }

    const selectedSOForSave =
      selectedSOOverride ||
      studentOutcomes.find((so) => so.id === getActiveSOId(selectedSOOverride)) ||
      null;

    if (!selectedSOForSave) {
      return null;
    }

    const assessmentBases = buildAssessmentBases(selectedSOForSave);
    const validBases = new Set(assessmentBases.map((basis) => basis.key));
    const nextMissingGradeMap = {};
    const missingEntries = [];
    const validationStudents = selectedStudent
      ? studentList.filter((student) => student.id === selectedStudent.id)
      : studentList;

    validationStudents.forEach((student) => {
      assessmentBases.forEach((basis) => {
        const score = student.grades?.[basis.key];
        if (score === null || score === undefined || score === "") {
          const missingKey = `${student.id}::${basis.key}`;
          nextMissingGradeMap[missingKey] = true;
          missingEntries.push({
            studentName: student.name,
            basisLabel: basis.label,
          });
        }
      });
    });

    const gradesPayload = {};
    studentList.forEach((student) => {
      gradesPayload[student.id] = {};

      Object.entries(student.grades || {}).forEach(([gradeKey, score]) => {
        if (score !== null && score !== undefined && score !== "") {
          if (!validBases.has(gradeKey)) {
            return;
          }

          gradesPayload[student.id][gradeKey] = score;
        }
      });
    });

    const hasScoreValue = (score) => score !== null && score !== undefined && score !== "";
    const studentsWithAnyGradeCount = studentList.filter((student) =>
      assessmentBases.some((basis) => hasScoreValue(student.grades?.[basis.key]))
    ).length;
    const fullyGradedStudentsCount = studentList.filter((student) =>
      assessmentBases.length > 0 && assessmentBases.every((basis) => hasScoreValue(student.grades?.[basis.key]))
    ).length;
    const totalStudents = studentList.length;
    const sectionStatus =
      totalStudents === 0 || studentsWithAnyGradeCount === 0
        ? "not-yet"
        : fullyGradedStudentsCount === totalStudents
          ? "assessed"
          : "incomplete";

    return {
      selectedSOForSave,
      nextMissingGradeMap,
      missingEntries,
      hasIncompleteEntries: missingEntries.length > 0,
      gradesPayload,
      sectionStatus,
      signature: createSaveSignature({
        sectionId: selectedSection.id,
        soId: selectedSOForSave.id,
        schoolYear: selectedSection.schoolYear,
        grades: gradesPayload,
      }),
    };
  };

  const persistAssessment = async ({
    studentList = latestStudentsRef.current,
    selectedSOOverride = selectedAssessmentSO,
    showToast = true,
    showStatusPopup = true,
    updateMissingState = true,
    mode = "manual",
  } = {}) => {
    const saveContext = buildSaveContext(studentList, selectedSOOverride);

    if (!selectedSection) {
      if (showToast) {
        toast({
          description: "No section selected",
          variant: "destructive",
          duration: 2000,
        });
      }
      return false;
    }

    if (!saveContext) {
      if (showToast) {
        toast({
          description: "Please select a Student Outcome first",
          variant: "destructive",
          duration: 2000,
        });
      }
      return false;
    }

    if (updateMissingState) {
      setMissingGradeMap(saveContext.hasIncompleteEntries ? saveContext.nextMissingGradeMap : {});
    }

    if (mode === "auto" && saveContext.signature === lastSavedSignatureRef.current) {
      return true;
    }

    if (mode === "manual") {
      setIsSaving(true);
    } else {
      setIsAutoSaving(true);
    }
    setAutoSaveError("");

    try {
      const headers = await getAuthHeader();
      await axios.post(`${API_BASE_URL}/assessments/save_grades/`, {
        section_id: selectedSection.id,
        so_id: saveContext.selectedSOForSave.id,
        school_year: selectedSection.schoolYear,
        grades: saveContext.gradesPayload,
      }, {
        headers,
      });

      lastSavedSignatureRef.current = saveContext.signature;
      setLastSavedAt(new Date());
      clearDraftGrades(selectedSection.id, saveContext.selectedSOForSave.id, selectedSection.schoolYear);

      if (showToast) {
        toast({
          description: "Assessment saved successfully!",
          duration: 2000,
        });
      }

      if (onSaveSuccess) {
        onSaveSuccess({
          sectionId: selectedSection.id,
          courseCode: selectedSection.courseCode,
          soId: saveContext.selectedSOForSave.id,
          sectionStatus: saveContext.sectionStatus,
        });
      }

      if (showStatusPopup) {
        if (saveContext.sectionStatus === "assessed") {
          setStatusPopup({
            open: true,
            title: "Assessment completed",
            description: "All required ratings are filled. This section is now marked as completed.",
            sectionStatus: saveContext.sectionStatus,
          });
        } else if (saveContext.sectionStatus === "incomplete") {
          setStatusPopup({
            open: true,
            title: "Assessment incomplete",
            description: saveContext.hasIncompleteEntries
              ? `${saveContext.missingEntries.length} field${saveContext.missingEntries.length > 1 ? "s are" : " is"} still blank. The section was saved as incomplete.`
              : "This section was saved as incomplete.",
            sectionStatus: saveContext.sectionStatus,
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error saving assessment:", error);
      console.error("Error response:", error.response?.data);

      const fallbackMessage = error.response?.data?.detail || "Failed to save assessment";
      if (mode === "auto") {
        setAutoSaveError(fallbackMessage);
      } else {
        toast({
          description: fallbackMessage,
          variant: "destructive",
          duration: 2000,
        });
      }

      return false;
    } finally {
      if (mode === "manual") {
        setIsSaving(false);
      } else {
        setIsAutoSaving(false);
      }
    }
  };

  const flushAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    return persistAssessment({
      showToast: false,
      showStatusPopup: false,
      updateMissingState: false,
      mode: "auto",
    });
  };

  const handleModalClose = () => {
    flushAutoSave();
    onClose();
  };

  const handleStudentOutcomeChange = async (outcomeId) => {
    await flushAutoSave();
    onChangeSelectedSO([outcomeId]);
  };

  useEffect(() => {
    latestStudentsRef.current = students;
  }, [students]);

  // Initialize students state from selectedSection
  useEffect(() => {
    if (selectedSection?.students && isOpen) {
      console.log("Modal opened/reloading, initializing students for section:", selectedSection.id);
      const initializedStudents = (selectedSection.students || []).map(student => ({
        ...student,
        grades: {},
      }));
      setMissingGradeMap({});
      
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
        lastSavedSignatureRef.current = "";
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
      setMissingGradeMap({});
      loadGrades(selectedSection.id, selectedSOIds[0], selectedSection.schoolYear, initializedStudents, selectedSection.courseCode);
    }
  }, [selectedSOIds, selectedSection?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || isLoadingAssessment || !selectedSection || !selectedAssessmentSO) {
      return undefined;
    }

    const saveContext = buildSaveContext(students, selectedAssessmentSO);
    if (!saveContext || saveContext.signature === lastSavedSignatureRef.current) {
      return undefined;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      persistAssessment({
        studentList: students,
        selectedSOOverride: selectedAssessmentSO,
        showToast: false,
        showStatusPopup: false,
        updateMissingState: false,
        mode: "auto",
      });
    }, 700);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [students, selectedAssessmentSO, selectedSection, isOpen, isLoadingAssessment]);

  const loadGrades = async (sectionId, soId, schoolYear, initialStudents, courseCode) => {
    let resolvedSelectedSO = null;
    setIsLoadingAssessment(true);
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(
        `${API_BASE_URL}/assessments/load_grades/`,
        {
          params: {
            section_id: sectionId,
            so_id: soId,
            school_year: schoolYear,
          },
          headers,
        }
      );
      const loadedGrades = response.data.grades || {};
      console.log("Loaded grades from backend:", loadedGrades);
      console.log("Backend response data:", response.data);
      
      // Fetch the full SO data directly from backend to ensure we have all criteria
      try {
        const soResponse = await axios.get(`${API_BASE_URL}/student-outcomes/${soId}/`, { headers });
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
      const localDraftGrades = readDraftGrades(sectionId, resolvedSelectedSO?.id || soId, schoolYear);
      const studentsWithDraft = localDraftGrades
        ? updatedStudents.map((student) => ({
            ...student,
            grades: {
              ...student.grades,
              ...(localDraftGrades[student.id] || {}),
            },
          }))
        : updatedStudents;
      console.log("Updated students with loaded grades:", updatedStudents);
      studentsWithDraft.forEach(s => {
        console.log(`  Student ${s.id} final grades:`, s.grades);
        Object.entries(s.grades).forEach(([key, val]) => {
          console.log(`    ${key} = ${val}`);
        });
      });      
      // Save the fetched SO data to state so the UI uses correct criteria
      setSelectedAssessmentSO(resolvedSelectedSO);
      setStudents(studentsWithDraft);
      lastSavedSignatureRef.current = localDraftGrades
        ? ""
        : createSaveSignature({
            sectionId,
            soId: resolvedSelectedSO?.id || soId,
            schoolYear,
            grades: transformedGrades,
          });
      if (localDraftGrades) {
        setAutoSaveError("A local draft was restored and will sync automatically.");
      } else {
        setAutoSaveError("");
      }
    } catch (error) {
      console.error("Error loading grades:", error);
      // Still set the SO even if grade loading failed, so UI shows correct structure
      if (resolvedSelectedSO) {
        setSelectedAssessmentSO(resolvedSelectedSO);
      }
      const localDraftGrades = readDraftGrades(sectionId, resolvedSelectedSO?.id || soId, schoolYear);
      const studentsWithDraft = localDraftGrades
        ? initialStudents.map((student) => ({
            ...student,
            grades: {
              ...student.grades,
              ...(localDraftGrades[student.id] || {}),
            },
          }))
        : initialStudents;
      setStudents(studentsWithDraft);
      lastSavedSignatureRef.current = "";
      if (localDraftGrades) {
        setAutoSaveError("A local draft was restored and will sync automatically.");
      }
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

      setModalWidth(Math.max(60, Math.min(98, newWidth)));
      setModalHeight(Math.max(60, Math.min(98, newHeight)));
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

      setModalWidth(Math.max(60, Math.min(98, newWidth)));
      setModalHeight(Math.max(60, Math.min(98, newHeight)));
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleGradeChange = (studentId, criterionKey, value) => {
    const missingKey = `${studentId}::${criterionKey}`;
    setMissingGradeMap((prev) => {
      if (!prev[missingKey]) {
        return prev;
      }

      const next = { ...prev };
      delete next[missingKey];
      return next;
    });

    setStudents((prevStudents) => {
      const nextStudents = prevStudents.map((student) =>
        student.id === studentId
          ? {
              ...student,
              grades: {
                ...student.grades,
                [criterionKey]: value,
              },
            }
          : student
      );

      const activeSOId = getActiveSOId();
      if (selectedSection && activeSOId) {
        writeDraftGrades(selectedSection.id, activeSOId, selectedSection.schoolYear, nextStudents);
      }

      return nextStudents;
    });
  };

  const handleClearAssessment = () => {
    setStudents((prevStudents) => {
      const nextStudents = prevStudents.map((student) => {
        if (selectedStudent && student.id !== selectedStudent.id) {
          return student;
        }

        return {
          ...student,
          grades: {},
        };
      });

      const activeSOId = getActiveSOId();
      if (selectedSection && activeSOId) {
        writeDraftGrades(selectedSection.id, activeSOId, selectedSection.schoolYear, nextStudents);
      }

      return nextStudents;
    });
    setMissingGradeMap({});
    setIsClearConfirmOpen(false);
    toast({
      title: "Assessment fields cleared",
      description: "All ratings in this table were cleared and will save automatically.",
      duration: 2500,
    });
  };

  const handleStatusPopupAcknowledge = () => {
    setStatusPopup({ open: false, title: "", description: "", sectionStatus: null });
  };

  const getGradeInputClassName = (score, isMissing) => {
    const baseClass = "w-full px-2 py-1.5 rounded border text-sm font-semibold focus:ring-2 cursor-pointer transition-all";

    if (isMissing) {
      return cn(baseClass, "border-red-400 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-200");
    }

    if (score === null || score === undefined || score === "") {
      return cn(baseClass, "border-[#D1D5DB] bg-white text-[#231F20] hover:border-[#FFC20E] focus:border-[#FFC20E] focus:ring-[#FFC20E]/30");
    }

    const numericScore = Number(score);
    if (numericScore <= 2) {
      return cn(baseClass, "border-red-300 bg-red-100 text-red-800 focus:border-red-400 focus:ring-red-200");
    }

    if (numericScore <= 4) {
      return cn(baseClass, "border-amber-300 bg-amber-100 text-amber-900 focus:border-amber-400 focus:ring-amber-200");
    }

    return cn(baseClass, "border-emerald-300 bg-emerald-100 text-emerald-900 focus:border-emerald-400 focus:ring-emerald-200");
  };

  const handleSave = async () => {
    await persistAssessment({
      studentList: students,
      selectedSOOverride: selectedAssessmentSO,
      showToast: true,
      showStatusPopup: true,
      updateMissingState: true,
      mode: "manual",
    });
  };

  const handlePrintRubric = () => {
    if (!selectedAssessmentSO || !activeStudent) {
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const buildRubricRowMarkup = (rows) =>
      rows
        .map((row, rowIndex) => {
          const currentScore = Number(activeStudent?.grades?.[row.scoreKey] || 0);
          const previousIndicator = rows[rowIndex - 1]?.performanceIndicator;
          const showIndicatorCell = rowIndex === 0 || previousIndicator !== row.performanceIndicator;
          const indicatorRowSpan = rows.filter((item) => item.performanceIndicator === row.performanceIndicator).length;

          const scoreColumnsMarkup = rubricScale
            .map((level) => {
              const isSelected = currentScore === level.value;
              return `
                <td class="${isSelected ? "selected-cell" : ""}">
                  <div class="level-badge">${level.value}</div>
                  <div>${escapeHtml(getRubricDescriptor(selectedAssessmentSO.number, row.criterionLabel, level.value))}</div>
                </td>
              `;
            })
            .join("");

          return `
            <tr>
              ${showIndicatorCell ? `<td rowspan="${indicatorRowSpan}" class="indicator-cell">${escapeHtml(row.performanceIndicator)}</td>` : ""}
              <td class="criterion-cell">${escapeHtml(row.criterionLabel)}</td>
              ${scoreColumnsMarkup}
              <td class="score-cell">${currentScore || "-"}</td>
            </tr>
          `;
        })
        .join("");

    const buildTableMarkup = (rows, includeTotals = false) => `
      <table>
        <thead>
          <tr>
            <th>Performance Indicator</th>
            <th>Sub Performance Indicator</th>
            ${rubricScale
              .map(
                (level) => `<th>${escapeHtml(level.label)}<br>${level.value}</th>`
              )
              .join("")}
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          ${buildRubricRowMarkup(rows)}
          ${
            includeTotals
              ? `
            <tr>
              <td colspan="8" class="totals-label">Total Score</td>
              <td class="score-cell">${rubricTotalScore}</td>
            </tr>
            <tr>
              <td colspan="9" class="totals-label">Percentage Rating = (Total Score / ${rubricMaxScore}) x 100% = ${rubricPercentage}%</td>
            </tr>
          `
              : ""
          }
        </tbody>
      </table>
    `;

    const printablePagesHtml = `
      <section class="print-page">
        <div class="rubric-sheet">
          <div class="sheet-header">
            <div class="school-name">TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES</div>
            <div class="rubric-title">RUBRIC FOR ${escapeHtml(selectedAssessmentSO.code)}</div>
            <div class="rubric-subtitle">(ENGINEERING PROGRAMS)</div>
            <div class="so-description">
              <strong>T.I.P. ${escapeHtml(selectedAssessmentSO.code)}</strong> ${escapeHtml(selectedAssessmentSO.description)}
            </div>
          </div>

          <div class="meta-grid">
            <div><span>Name</span><strong>${escapeHtml(activeStudent.name || "-")}</strong></div>
            <div><span>Program</span><strong>${escapeHtml(activeStudent.program || "Computer Engineering")}</strong></div>
            <div><span>Course</span><strong>${escapeHtml(selectedSection.courseCode || "-")}</strong></div>
            <div><span>Section</span><strong>${escapeHtml(selectedSection.name || "-")}</strong></div>
            <div><span>Semester</span><strong>${escapeHtml(selectedSection.semester || "-")}</strong></div>
            <div><span>School Year</span><strong>${escapeHtml(selectedSection.schoolYear || "-")}</strong></div>
          </div>

          ${buildTableMarkup(rubricRows, true)}

          <div class="signature-grid">
            <div class="signature-block">
              <div class="signature-label">Evaluated by:</div>
              <div class="signature-line"></div>
              <div class="signature-caption">Printed Name and Signature of Faculty Member</div>
            </div>
            <div class="signature-block signature-date">
              <div class="signature-label">Date</div>
              <div class="signature-line"></div>
            </div>
          </div>
        </div>
      </section>
    `;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      toast({
        title: "Unable to open print preview",
        description: "Please allow pop-ups for this site to print or save the rubric as PDF.",
        variant: "destructive",
      });
      return;
    }

    const printStyles = `
      <style>
        @page { size: legal landscape; margin: 6mm; }
        body { font-family: Arial, sans-serif; color: #231F20; margin: 0; background: white; }
        .print-shell { padding: 0; }
        .print-page { width: 100%; }
        .rubric-sheet { width: 100%; }
        .sheet-header { text-align: center; margin-bottom: 8px; }
        .school-name { font-size: 10px; letter-spacing: 0.16em; }
        .rubric-title { margin-top: 6px; font-size: 16px; font-weight: 700; }
        .rubric-subtitle { margin-top: 2px; font-size: 11px; color: #555; }
        .so-description { margin-top: 8px; text-align: left; font-size: 11px; line-height: 1.25; }
        .meta-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin: 8px 0 10px; font-size: 10px; }
        .meta-grid span { display: block; text-transform: uppercase; font-size: 9px; color: #666; margin-bottom: 2px; }
        .meta-grid strong { font-size: 11px; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
        th, td { border: 1px solid #231F20; padding: 4px; vertical-align: top; }
        th { background: #f5f5f5; text-align: center; font-weight: 700; }
        .indicator-cell { width: 17%; }
        .criterion-cell { width: 15%; }
        .selected-cell { background: #FFF3C4; }
        .level-badge { display: inline-flex; width: 16px; height: 16px; align-items: center; justify-content: center; border: 1px solid #231F20; border-radius: 9999px; font-size: 9px; font-weight: 700; margin-bottom: 4px; }
        .score-cell { width: 34px; text-align: center; font-weight: 700; }
        .totals-label { text-align: right; font-weight: 700; }
        .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 16px; font-size: 11px; }
        .signature-block { min-height: 52px; }
        .signature-date { justify-self: end; width: 60%; }
        .signature-label { margin-bottom: 16px; }
        .signature-line { border-bottom: 1px solid #231F20; height: 1px; }
        .signature-caption { margin-top: 4px; font-size: 9px; color: #555; }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedAssessmentSO.code} - ${activeStudent.name} Rubric</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-shell">
            ${printablePagesHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (!selectedSection) return null;

  const courseSOs = courseMappings[selectedSection.courseCode] || [];
  const connectedSOs = studentOutcomes.filter(so =>
    courseSOs.some(soId => parseInt(soId) === so.id)
  );
  // Use the state variable selectedAssessmentSO which is populated from backend data with correct criteria
  // This ensures we display only the criteria that belong to the selected SO
  const displayIndicators = selectedAssessmentSO?.performanceIndicators || [];
  const activeStudent =
    students.find((student) => student.id === selectedStudent?.id) ||
    (selectedStudent ? null : students[0] || null);
  const visibleStudents = activeStudent ? [activeStudent] : students;
  const indicatorsWithoutCriteria = displayIndicators.filter(
    (pi) => !pi.performanceCriteria || pi.performanceCriteria.length === 0
  ).length;
  const hasMissingGrades = Object.keys(missingGradeMap).length > 0;
  const hasAnyEnteredGrade = visibleStudents.some((student) =>
    Object.values(student.grades || {}).some((score) => score !== null && score !== undefined && score !== "")
  );
  const rubricScale = [
    { value: 1, label: "Very Poor" },
    { value: 2, label: "Poor" },
    { value: 3, label: "Unsatisfactory" },
    { value: 4, label: "Satisfactory" },
    { value: 5, label: "Good" },
    { value: 6, label: "Excellent" },
  ];
  const normalizeRubricKey = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const so4RubricDescriptors = {
    [normalizeRubricKey("Apply principles of ethics and comply with professional Ethics, Technology Ethics, and Data Ethics")]: {
      1: "Student is fully not compliant with professional ethics, technology ethics, and data ethics.",
      2: "Student is not compliant with professional ethics, technology ethics, and data ethics.",
      3: "Student minimally complies with professional ethics, technology ethics, and data ethics.",
      4: "Student is compliant to a certain extent with professional ethics, technology ethics, and data ethics.",
      5: "Student is compliant with professional ethics and follows technology ethics and data ethics.",
      6: "Student fully complies with professional ethics, technology ethics, and data ethics.",
    },
    [normalizeRubricKey("Adopt global responsibilities and norms of engineering practice")]: {
      1: "Student is fully not able to adopt global responsibilities and norms of engineering practice.",
      2: "Student is not able to adopt global responsibilities and norms of engineering practice.",
      3: "Student is able to minimally adopt global responsibilities and norms of engineering practice.",
      4: "Student is able to adopt to a certain extent global responsibilities and norms of engineering practice.",
      5: "Student is able to adopt global responsibilities and norms of engineering practice.",
      6: "Student is fully able to adopt global responsibilities and norms of engineering practice.",
    },
    [normalizeRubricKey("Adhere to relevant national and international laws")]: {
      1: "Student is fully not adherent to relevant national and international laws.",
      2: "Student is not adherent to relevant national and international laws.",
      3: "Student is minimally adherent to relevant national and international laws.",
      4: "Student is adherent to a certain extent to relevant national and international laws.",
      5: "Student is adherent to relevant national and international laws.",
      6: "Student is fully adherent to relevant national and international laws.",
    },
    [normalizeRubricKey("Comprehend the need for diversity and inclusion")]: {
      1: "Student does not totally understand the need for diversity and inclusion.",
      2: "Student does not understand the need for diversity and inclusion.",
      3: "Student minimally understands the need for diversity and inclusion.",
      4: "Student understands to a certain extent the need for diversity and inclusion.",
      5: "Student understands the need for diversity and inclusion.",
      6: "Student fully understands the need for diversity and inclusion.",
    },
    [normalizeRubricKey("Ability to recognize ethical and professional responsibilities in engineering situations")]: {
      1: "Student does not totally recognize ethical and professional responsibilities in engineering situations.",
      2: "Student does not recognize ethical and professional responsibilities in engineering situations.",
      3: "Student minimally recognizes ethical and professional responsibilities in engineering situations.",
      4: "Student recognizes to a certain extent ethical and professional responsibilities in engineering situations.",
      5: "Student recognizes ethical and professional responsibilities in engineering situations.",
      6: "Student fully recognizes ethical and professional responsibilities in engineering situations.",
    },
    [normalizeRubricKey("Ability to make informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts")]: {
      1: "Student is totally unable to make informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
      2: "Student is unable to make informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
      3: "Student can minimally make informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
      4: "Student makes informed judgments to a certain extent which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
      5: "Student makes informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
      6: "Student fully makes informed judgments which must consider the sustainability impact of engineering solutions in human, cultural, global, economic, environmental, and societal contexts.",
    },
  };
  const getRubricDescriptor = (soNumber, basisLabel, scoreValue) => {
    const normalizedLabel = normalizeRubricKey(basisLabel);
    if (Number(soNumber) === 4 && so4RubricDescriptors[normalizedLabel]?.[scoreValue]) {
      return so4RubricDescriptors[normalizedLabel][scoreValue];
    }

    const scaleLead = {
      1: "Student shows very limited evidence of",
      2: "Student shows weak evidence of",
      3: "Student shows emerging evidence of",
      4: "Student demonstrates acceptable performance in",
      5: "Student demonstrates strong performance in",
      6: "Student demonstrates excellent performance in",
    };

    return `${scaleLead[scoreValue] || "Student demonstrates performance in"} ${String(basisLabel || "this criterion").toLowerCase()}.`;
  };
  const rubricRows = displayIndicators.flatMap((pi) => {
    if (!pi.performanceCriteria || pi.performanceCriteria.length === 0) {
      return [
        {
          key: `indicator:${pi.id}`,
          performanceIndicator: pi.name,
          criterionLabel: pi.name,
          scoreKey: `indicator:${pi.id}`,
        },
      ];
    }

    return pi.performanceCriteria.map((pc) => ({
      key: `criterion:${pc.id}`,
      performanceIndicator: pi.name,
      criterionLabel: pc.name,
      scoreKey: `criterion:${pc.id}`,
    }));
  });
  const rubricTotalScore = rubricRows.reduce((sum, row) => sum + (Number(activeStudent?.grades?.[row.scoreKey]) || 0), 0);
  const rubricMaxScore = rubricRows.length * 6;
  const rubricPercentage = rubricMaxScore > 0 ? ((rubricTotalScore / rubricMaxScore) * 100).toFixed(0) : "0";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleModalClose();
    }}>
      <style>{`
        .assessment-table-container {
          position: relative;
          overflow-x: scroll !important;
          overflow-y: auto !important;
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
              onClick={handleModalClose}
              className="p-2 hover:bg-[#FFC20E]/10 rounded-lg transition-colors text-[#231F20]"
              title="Back to sections"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {selectedStudent ? `Assess ${selectedStudent.name}` : `Assess Students — ${selectedSection?.name}`}
              </DialogTitle>
              <DialogDescription>
                {selectedStudent
                  ? "Review the selected student and complete the rubric one student at a time."
                  : "Review section details, select a Student Outcome, and assess students."}
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

          {activeStudent && (
            <div className="rounded-lg border border-[#231F20]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">Student Rubric Sheet</p>
                  <h3 className="mt-1 text-xl font-bold text-[#231F20]">{activeStudent.name}</h3>
                </div>
                <div className="rounded-full bg-[#FFF8DB] px-3 py-1 text-xs font-semibold text-[#231F20]">
                  {selectedSection.courseCode} · {selectedSection.name}
                </div>
              </div>
              <div className="grid gap-3 text-sm text-[#231F20] md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Student ID</p>
                  <p className="mt-1 font-medium">{activeStudent.studentId || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Program</p>
                  <p className="mt-1 font-medium">{activeStudent.program || selectedSection.courseCode || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Course</p>
                  <p className="mt-1 font-medium">{selectedSection.courseName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Section</p>
                  <p className="mt-1 font-medium">{selectedSection.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Semester</p>
                  <p className="mt-1 font-medium">{selectedSection.semester || "-"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6B6B]">School Year</p>
                  <p className="mt-1 font-medium">{selectedSection.schoolYear || "-"}</p>
                </div>
              </div>
            </div>
          )}

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
                          onClick={() => handleStudentOutcomeChange(outcome.id)}
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

                  {!isLoadingAssessment && selectedAssessmentSO && visibleStudents.length > 0 && displayIndicators.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3">
                      <div>
                        <h4 className="text-base font-semibold text-[#231F20] mb-3 flex items-center gap-2">
                          <UsersRound className="w-5 h-5 text-[#FFC20E]" />
                          {selectedStudent ? `Rubric Assessment — ${selectedAssessmentSO.code}` : `Assess Students — ${selectedAssessmentSO.code}`}
                        </h4>
                        <p className="text-xs text-[#6B6B6B] mb-3">
                          {selectedStudent
                            ? "Rate the selected student for each sub performance indicator or performance indicator using the 1-6 rubric scale."
                            : "Rate each student's performance for each sub performance indicator or performance indicator (1-6 scale, where 6 is highest)."}
                        </p>
                        {indicatorsWithoutCriteria > 0 && (
                          <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                            {indicatorsWithoutCriteria} performance indicator{indicatorsWithoutCriteria > 1 ? "s use" : " uses"} the performance indicator itself as the grading basis because no sub performance indicators are defined yet.
                          </div>
                        )}
                        {hasMissingGrades && (
                          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            Some ratings are still blank. Highlighted cells must be filled before you can save this assessment.
                          </div>
                        )}
                      </div>

                      <div ref={rubricSheetRef} className="rounded-xl border border-[#D1D5DB] bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-[#D1D5DB] bg-[#FAFAF7] px-6 py-5 text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#231F20]">
                            Technological Institute of the Philippines
                          </p>
                          <h5 className="mt-3 text-lg font-semibold uppercase text-[#231F20]">
                            Rubric for {selectedAssessmentSO.title}
                          </h5>
                          <p className="text-sm font-medium uppercase text-[#6B6B6B]">(Engineering Programs)</p>
                          <p className="mt-4 text-left text-sm leading-relaxed text-[#231F20]">
                            <span className="font-semibold">T.I.P. {selectedAssessmentSO.code}</span> {selectedAssessmentSO.description}
                          </p>
                        </div>

                        <div className="grid gap-3 border-b border-[#D1D5DB] px-6 py-4 text-sm text-[#231F20] md:grid-cols-3 lg:grid-cols-6">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Name</p>
                            <p className="mt-1 font-medium">{activeStudent?.name || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Program</p>
                            <p className="mt-1 font-medium">{activeStudent?.program || "Computer Engineering"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Course</p>
                            <p className="mt-1 font-medium">{selectedSection.courseCode}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Section</p>
                            <p className="mt-1 font-medium">{selectedSection.name}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Semester</p>
                            <p className="mt-1 font-medium">{selectedSection.semester || "-"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">School Year</p>
                            <p className="mt-1 font-medium">{selectedSection.schoolYear || "-"}</p>
                          </div>
                        </div>

                        <div className="overflow-auto">
                          <table className="min-w-[1280px] w-full border-collapse text-[11px] leading-tight text-[#231F20]">
                            <thead>
                              <tr className="bg-[#F5F5F5]">
                                <th className="border border-[#231F20] px-2 py-2 text-center font-semibold">Performance Indicator</th>
                                <th className="border border-[#231F20] px-2 py-2 text-center font-semibold">Sub Performance Indicator</th>
                                {rubricScale.map((level) => (
                                  <th key={`level-${level.value}`} className="border border-[#231F20] px-2 py-2 text-center font-semibold min-w-[140px]">
                                    <div>{level.label}</div>
                                    <div>{level.value}</div>
                                  </th>
                                ))}
                                <th className="border border-[#231F20] px-2 py-2 text-center font-semibold min-w-[90px]">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rubricRows.map((row, rowIndex) => {
                                const currentScore = activeStudent?.grades?.[row.scoreKey] ?? "";
                                const previousIndicator = rubricRows[rowIndex - 1]?.performanceIndicator;
                                const showIndicatorCell = rowIndex === 0 || previousIndicator !== row.performanceIndicator;
                                const indicatorRowSpan = rubricRows.filter((item) => item.performanceIndicator === row.performanceIndicator).length;

                                return (
                                  <tr key={row.key} className="align-top">
                                    {showIndicatorCell && (
                                      <td rowSpan={indicatorRowSpan} className="border border-[#231F20] px-2 py-3 font-medium">
                                        {row.performanceIndicator}
                                      </td>
                                    )}
                                    <td className="border border-[#231F20] px-2 py-3 font-medium">
                                      {row.criterionLabel}
                                    </td>
                                    {rubricScale.map((level) => {
                                      const isSelected = Number(currentScore) === level.value;
                                      return (
                                        <td
                                          key={`${row.key}-${level.value}`}
                                          className={cn(
                                            "border border-[#231F20] px-2 py-3 align-top transition-colors",
                                            isSelected && "bg-[#FFF3C4]"
                                          )}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => handleGradeChange(activeStudent.id, row.scoreKey, level.value)}
                                            className={cn(
                                              "flex h-full w-full flex-col items-start gap-2 text-left",
                                              isSelected ? "text-[#231F20]" : "text-[#3A3A3A]"
                                            )}
                                          >
                                            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[#231F20] px-1 text-[10px] font-bold">
                                              {level.value}
                                            </span>
                                            <span>{getRubricDescriptor(selectedAssessmentSO.number, row.criterionLabel, level.value)}</span>
                                          </button>
                                        </td>
                                      );
                                    })}
                                    <td className="border border-[#231F20] px-2 py-3">
                                      <select
                                        value={currentScore}
                                        onChange={(e) => handleGradeChange(activeStudent.id, row.scoreKey, e.target.value ? parseInt(e.target.value, 10) : null)}
                                        className={getGradeInputClassName(
                                          currentScore,
                                          missingGradeMap[`${activeStudent.id}::${row.scoreKey}`]
                                        )}
                                      >
                                        <option value="">-</option>
                                        {rubricScale.map((level) => (
                                          <option key={`score-option-${row.key}-${level.value}`} value={level.value}>
                                            {level.value}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-[#FAFAF7]">
                                <td colSpan={8} className="border border-[#231F20] px-3 py-2 text-right font-semibold">
                                  Total Score
                                </td>
                                <td className="border border-[#231F20] px-3 py-2 text-center font-semibold">
                                  {rubricTotalScore}
                                </td>
                              </tr>
                              <tr className="bg-[#FAFAF7]">
                                <td colSpan={9} className="border border-[#231F20] px-3 py-2 text-right font-semibold">
                                  Percentage Rating = (Total Score / {rubricMaxScore}) x 100% = {rubricPercentage}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="grid gap-4 px-6 py-6 text-sm text-[#231F20] md:grid-cols-3">
                          <div>
                            <p className="mb-6">Evaluated by:</p>
                            <div className="border-b border-[#231F20] pb-1" />
                            <p className="mt-2 text-xs text-[#6B6B6B]">Printed Name and Signature of Faculty Member</p>
                          </div>
                          <div className="md:col-start-3">
                            <p className="mb-6">Date</p>
                            <div className="border-b border-[#231F20] pb-1" />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 pt-3 md:flex-row md:items-center md:justify-between">
                        <div className="text-xs text-[#6B6B6B]">
                          {isAutoSaving
                            ? "Saving progress automatically..."
                            : autoSaveError
                              ? autoSaveError
                              : lastSavedAt
                                ? `Progress saved at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                : "Progress saves automatically as you grade."}
                        </div>
                        <div className="flex justify-end gap-3">
                        <button
                          onClick={handlePrintRubric}
                          disabled={!selectedAssessmentSO || !activeStudent}
                          className="flex items-center gap-2 px-5 py-2.5 border border-[#231F20] text-[#231F20] rounded-lg font-semibold hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                          Print / Save PDF
                        </button>
                        <button
                          onClick={() => setIsClearConfirmOpen(true)}
                          disabled={isSaving || isAutoSaving || !hasAnyEnteredGrade}
                          className="flex items-center gap-2 px-5 py-2.5 border border-[#D1D5DB] text-[#231F20] rounded-lg font-semibold hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Eraser className="w-4 h-4" />
                          {selectedStudent ? "Clear Student Assessment" : "Clear Assessment"}
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving || isAutoSaving}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#FFC20E] text-[#231F20] rounded-lg font-semibold hover:bg-[#FFC20E]/90 disabled:opacity-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Saving...' : 'Save Assessment'}
                        </button>
                        </div>
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

      <AlertDialog
        open={isClearConfirmOpen}
        onOpenChange={setIsClearConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear assessment fields?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStudent
                ? "This will remove the selected student's current ratings and save the cleared state automatically."
                : "This will remove all current ratings in the table and save the cleared state automatically."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAssessment}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {selectedStudent ? "Clear Student" : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={statusPopup.open}
        onOpenChange={(open) => {
          if (!open) {
            setStatusPopup((prev) => ({ ...prev, open: false }));
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusPopup.title}</AlertDialogTitle>
            <AlertDialogDescription>{statusPopup.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleStatusPopupAcknowledge}
              className="bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}


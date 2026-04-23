import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  PenTool,
  MessageSquare,
  Scale,
  FlaskConical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

const SATISFACTORY_THRESHOLD = 5;

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
  const [missingGradeMap, setMissingGradeMap] = useState({});
  const [modalWidth, setModalWidth] = useState(95); // in vw
  const [modalHeight, setModalHeight] = useState(96); // in vh
  const headerRow1Ref = useRef(null);
  const headerRow2Ref = useRef(null);
  const [stickyHeaderTops, setStickyHeaderTops] = useState({ row2: 48, row3: 88 });
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

    studentList.forEach((student) => {
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
      await axios.post(`${API_BASE_URL}/assessments/save_grades/`, {
        section_id: selectedSection.id,
        so_id: saveContext.selectedSOForSave.id,
        school_year: selectedSection.schoolYear,
        grades: saveContext.gradesPayload,
      }, {
        headers: getAuthHeaders(),
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

  useLayoutEffect(() => {
    let rafId = null;
    let timeoutId = null;

    const updateStickyHeaderOffsets = () => {
      const row1Height = headerRow1Ref.current?.getBoundingClientRect().height || 0;
      const row2Height = headerRow2Ref.current?.getBoundingClientRect().height || 0;

      if (row1Height > 0 || row2Height > 0) {
        setStickyHeaderTops({
          row2: row1Height,
          row3: row1Height + row2Height,
        });
      }
    };

    const scheduleStickyHeaderOffsetsUpdate = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateStickyHeaderOffsets);
    };

    scheduleStickyHeaderOffsetsUpdate();
    timeoutId = setTimeout(scheduleStickyHeaderOffsetsUpdate, 120);

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleStickyHeaderOffsetsUpdate)
      : null;

    if (resizeObserver) {
      if (headerRow1Ref.current) resizeObserver.observe(headerRow1Ref.current);
      if (headerRow2Ref.current) resizeObserver.observe(headerRow2Ref.current);
    }

    window.addEventListener("resize", scheduleStickyHeaderOffsetsUpdate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleStickyHeaderOffsetsUpdate);
    };
  }, [
    selectedAssessmentSO?.id,
    selectedAssessmentSO?.performanceIndicators?.length,
    students.length,
    isLoadingAssessment,
    modalWidth,
    modalHeight,
  ]);

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
          headers: getAuthHeaders(),
        }
      );
      const loadedGrades = response.data.grades || {};
      console.log("Loaded grades from backend:", loadedGrades);
      console.log("Backend response data:", response.data);
      
      // Fetch the full SO data directly from backend to ensure we have all criteria
      try {
        const soResponse = await axios.get(`${API_BASE_URL}/student-outcomes/${soId}/`, {
          headers: getAuthHeaders(),
        });
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
      const nextStudents = prevStudents.map((student) => ({
        ...student,
        grades: {},
      }));

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

  if (!selectedSection) return null;

  const courseSOs = courseMappings[selectedSection.courseCode] || [];
  const connectedSOs = studentOutcomes.filter(so =>
    courseSOs.some(soId => parseInt(soId) === so.id)
  );
  // Use the state variable selectedAssessmentSO which is populated from backend data with correct criteria
  // This ensures we display only the criteria that belong to the selected SO
  const displayIndicators = selectedAssessmentSO?.performanceIndicators || [];
  const fixedStudentColumnsWidth = 260;
  const indicatorColumnCount = displayIndicators.reduce(
    (sum, pi) => sum + Math.max(pi.performanceCriteria?.length || 1, 1),
    0
  );
  const calculatedTableWidth = Math.max(fixedStudentColumnsWidth + indicatorColumnCount * 110, 800);
  const indicatorsWithoutCriteria = displayIndicators.filter(
    (pi) => !pi.performanceCriteria || pi.performanceCriteria.length === 0
  ).length;
  const displayBases = buildAssessmentBases(selectedAssessmentSO);
  const hasMissingGrades = Object.keys(missingGradeMap).length > 0;
  const hasAnyEnteredGrade = students.some((student) =>
    Object.values(student.grades || {}).some((score) => score !== null && score !== undefined && score !== "")
  );
  const footerSummary = displayBases.map((basis) => {
    const answeredCount = students.filter((student) => {
      const score = student.grades?.[basis.key];
      return score !== null && score !== undefined && score !== "";
    }).length;

    const satisfactoryCount = students.filter((student) => {
      const score = student.grades?.[basis.key];
      return score !== null && score !== undefined && score !== "" && Number(score) >= SATISFACTORY_THRESHOLD;
    }).length;

    return {
      ...basis,
      answeredCount,
      satisfactoryCount,
    };
  });
  const averageSatisfactoryCount =
    footerSummary.length > 0
      ? (footerSummary.reduce((sum, basis) => sum + basis.satisfactoryCount, 0) / footerSummary.length).toFixed(0)
      : "0";

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

                  {!isLoadingAssessment && selectedAssessmentSO && students.length > 0 && displayIndicators.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3">
                      <div>
                        <h4 className="text-base font-semibold text-[#231F20] mb-3 flex items-center gap-2">
                          <UsersRound className="w-5 h-5 text-[#FFC20E]" />
                          Assess Students — {selectedAssessmentSO.code}
                        </h4>
                        <p className="text-xs text-[#6B6B6B] mb-3">
                          Rate each student's performance for each sub performance indicator or performance indicator (1-6 scale, where 6 is highest)
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

                      <div
                        className="assessment-table-container rounded-lg border border-[#D1D5DB] bg-white shadow-sm"
                        style={{ minHeight: '560px', height: 'clamp(560px, 74vh, 980px)', display: 'block', overflow: 'auto' }}
                      >
                        <table
                          className="border-separate border-spacing-0 text-sm"
                          style={{
                            width: `${calculatedTableWidth}px`,
                            minWidth: 'calc(100% + 20px)'
                          }}
                        >
                          <thead>
                            {/* Row 1: Performance Indicator Headers */}
                            <tr ref={headerRow1Ref} className="bg-gradient-to-r from-[#231F20] to-[#3A3A3A]">
                              <th
                                colSpan={2}
                                className="border-r border-[#D1D5DB] px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-white min-w-[260px] bg-gradient-to-r from-[#231F20] to-[#3A3A3A]"
                                style={{ position: 'sticky', top: 0, left: 0, zIndex: 90 }}
                              >
                                Student
                              </th>
                              <th
                                colSpan={indicatorColumnCount}
                                className="relative overflow-hidden border-r border-[#D1D5DB] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white last:border-r-0"
                                style={{ position: 'sticky', top: 0, zIndex: 110 }}
                              >
                                <div
                                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#111111] to-[#1F1F1F]"
                                  aria-hidden="true"
                                />
                                <span className="relative z-[1]">Performance Indicators</span>
                              </th>
                            </tr>

                            {/* Row 2: PI Names */}
                            <tr ref={headerRow2Ref} className="bg-[#F5F5F5] border-b border-[#E5E7EB]">
                              <th
                                colSpan={2}
                                className="border-r border-[#D1D5DB] px-4 py-2.5 text-left text-xs font-semibold text-[#231F20] bg-[#F5F5F5]"
                                style={{ position: 'sticky', top: stickyHeaderTops.row2, left: 0, zIndex: 80 }}
                              >
                                No. / Name
                              </th>
                              {displayIndicators.map((pi) => {
                                return (
                                  <td
                                    key={`pi-name-${pi.id}`}
                                    colSpan={Math.max(pi.performanceCriteria?.length || 0, 1)}
                                    className="border-r border-[#E5E7EB] px-2 py-2.5 text-center text-xs font-semibold text-[#231F20] bg-[#F5F5F5] align-middle last:border-r-0 leading-tight"
                                    style={{
                                      minWidth: `${Math.max(pi.performanceCriteria?.length || 0, 1) * 110}px`,
                                      position: 'sticky',
                                      top: stickyHeaderTops.row2,
                                      zIndex: 75,
                                    }}
                                  >
                                    {pi.name}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 3: Sub Performance Indicators */}
                            {displayIndicators.length > 0 && (
                              <tr className="bg-[#FFF8DB] border-b border-[#E5E7EB]">
                                <th
                                  colSpan={2}
                                  className="border-r border-[#D1D5DB] px-4 py-2 text-left text-xs font-semibold text-[#6B6B6B] bg-[#FFF8DB]"
                                  style={{ position: 'sticky', top: stickyHeaderTops.row3, left: 0, zIndex: 70 }}
                                >
                                  Sub Performance Indicator
                                </th>
                                {displayIndicators.map((pi) => {
                                  if (!pi.performanceCriteria || pi.performanceCriteria.length === 0) {
                                    return (
                                      <th
                                        key={`pc-${pi.id}-indicator`}
                                        className="min-w-[110px] border-r border-[#E5E7EB] bg-[#FFF8DB] last:border-r-0"
                                        style={{ position: 'sticky', top: stickyHeaderTops.row3, zIndex: 65 }}
                                        aria-hidden="true"
                                      />
                                    );
                                  }

                                  return pi.performanceCriteria.map((pc) => (
                                    <th
                                      key={`pc-${pi.id}-${pc.id}`}
                                      className="min-w-[110px] border-r border-[#E5E7EB] px-2 py-2 text-center text-xs font-semibold text-[#231F20] bg-[#FFF8DB] last:border-r-0 leading-tight"
                                      style={{ position: 'sticky', top: stickyHeaderTops.row3, zIndex: 65 }}
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
                                <td className="border-r border-[#E5E7EB] px-4 py-2.5 text-center text-sm font-bold text-white bg-[#231F20] min-w-[50px]" style={{position: 'sticky', left: 0, zIndex: 30}}>
                                  {idx + 1}
                                </td>
                                <td className="border-r border-[#E5E7EB] px-4 py-2.5 text-sm bg-[#F9F9F9] min-w-[210px]" style={{position: 'sticky', left: '50px', zIndex: 30}}>
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
                                          className={getGradeInputClassName(
                                            students.find(s => s.id === student.id)?.grades?.[`indicator:${pi.id}`],
                                            missingGradeMap[`${student.id}::indicator:${pi.id}`]
                                          )}
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
                                        className={getGradeInputClassName(
                                          students.find(s => s.id === student.id)?.grades?.[`criterion:${pc.id}`],
                                          missingGradeMap[`${student.id}::criterion:${pc.id}`]
                                        )}
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

                            {footerSummary.length > 0 && (
                              <>
                                <tr className="border-t-2 border-[#231F20] bg-[#FFF8DB]">
                                  <td
                                    colSpan={2}
                                    className="border-r border-[#D1D5DB] px-4 py-2 text-left text-xs font-semibold text-[#231F20] bg-[#FFF8DB]"
                                    style={{ position: "sticky", left: 0, zIndex: 15 }}
                                  >
                                    No. of Students Answered per sub performance indicator / indicator
                                  </td>
                                  {footerSummary.map((basis) => (
                                    <td
                                      key={`answered-summary-${basis.key}`}
                                      className="border-r border-[#E5E7EB] px-2 py-2 text-center text-sm font-semibold text-[#231F20] bg-[#FFF8DB] last:border-r-0"
                                    >
                                      {basis.answeredCount}
                                    </td>
                                  ))}
                                </tr>
                                <tr className="bg-white">
                                  <td
                                    colSpan={2}
                                    className="border-r border-[#D1D5DB] px-4 py-2 text-left text-xs font-semibold text-[#231F20] bg-white"
                                    style={{ position: "sticky", left: 0, zIndex: 15 }}
                                  >
                                    Actual no. of students who got satisfactory rating
                                  </td>
                                  {footerSummary.map((basis) => (
                                    <td
                                      key={`satisfactory-summary-${basis.key}`}
                                      className="border-r border-[#E5E7EB] px-2 py-2 text-center text-sm font-semibold text-[#231F20] bg-white last:border-r-0"
                                    >
                                      {basis.satisfactoryCount}
                                    </td>
                                  ))}
                                </tr>
                                <tr className="bg-[#FFF8DB]">
                                  <td
                                    colSpan={2}
                                    className="border-r border-[#D1D5DB] px-4 py-2 text-left text-xs font-semibold text-[#231F20] bg-[#FFF8DB]"
                                    style={{ position: "sticky", left: 0, zIndex: 15 }}
                                  >
                                    Average no. of students who got satisfactory rating
                                  </td>
                                  <td
                                    colSpan={footerSummary.length}
                                    className="px-2 py-2 text-center text-sm font-semibold text-[#231F20] bg-[#FFF8DB]"
                                  >
                                    {averageSatisfactoryCount}
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
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
                          onClick={() => setIsClearConfirmOpen(true)}
                          disabled={isSaving || isAutoSaving || !hasAnyEnteredGrade}
                          className="flex items-center gap-2 px-5 py-2.5 border border-[#D1D5DB] text-[#231F20] rounded-lg font-semibold hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Eraser className="w-4 h-4" />
                          Clear Assessment
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
              This will remove all current ratings in the table and save the cleared state automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAssessment}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Clear All
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


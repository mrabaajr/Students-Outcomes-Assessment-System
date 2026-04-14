import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const PAGE_GUIDES = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    summary: "See overall progress, quick actions, and recent assessment activity.",
    previewTitle: "Student Outcomes Assessment Portal",
    previewMetrics: [
      { label: "Student Outcomes", value: "SO" },
      { label: "Courses Mapped", value: "Courses" },
      { label: "Students Assessed", value: "Students" },
      { label: "Avg. Performance", value: "Performance" },
    ],
    howItWorks: [
      {
        text: "Review summary cards for coverage and performance at a glance.",
        imageSrc: "/getting-started/Dashboard_1.png",
        imageAlt: "Dashboard summary cards",
      },
      {
        text: "Use quick action cards to jump to the next task.",
        imageSrc: "/getting-started/Dasboard_2.png",
        imageAlt: "Dashboard quick actions",
      },
      {
        text: "Click the SO Assessment to go back to the dashboard.",
        imageSrc: "/getting-started/Dasboard_3.png",
        imageAlt: "SO Assessment header navigation",
      },
      {
        text: "Check recent activity to identify updates and pending work.",
        imageSrc: "/getting-started/Dashboard_4.png",
        imageAlt: "Dashboard recent activity",
      },
      {
        text: "Monitor overall SO Assessment Progress to identify areas for improvement.",
        imageSrc: "/getting-started/Dashboard_5.png",
        imageAlt: "SO Assessment progress section",
      },
      {
        text: "Use filters to focus on specific school years.",
        imageSrc: "/getting-started/Dashboard_6.png",
        imageAlt: "Dashboard school year filters",
      },
    ],
    routes: {
      admin: "/programchair/dashboard",
      staff: "/faculty/dashboard",
    },
  },
  {
    id: "student-outcomes",
    title: "Student Outcomes",
    icon: GraduationCap,
    summary: "Create and maintain Student Outcomes, indicators, and criteria.",
    previewTitle: "Student Outcomes and Rubric Builder",
    previewMetrics: [
      { label: "Outcome", value: "SO" },
      { label: "Indicators", value: "PI" },
      { label: "Criteria", value: "PC" },
      { label: "Version", value: "Draft" },
    ],
    howItWorks: [
      {
        text: "Use the Add new SO button for Add New SO modal appear.",
        imageSrc: "/getting-started/SO_1.png",
        imageAlt: "Add new SO button and modal",
      },
      {
        text: "Edit SO definitions and rubric structure.",
        imageSrc: "/getting-started/SO_2.png",
        imageAlt: "SO definitions and rubric structure",
      },
      {
        text: "View SO Rubric with Rubric Table to edit the Performance indicator and Criterion.",
        imageSrc: "/getting-started/SO_3.png",
        imageAlt: "SO rubric table and performance indicators",
      },
      {
        text: "Save updates to ensure Assessment and Reports use the latest rubric.",
        imageSrc: "/getting-started/SO_4.png",
        imageAlt: "Save updated SO rubric",
      },
      {
        text: "Keep numbering and wording consistent across outcomes.",
        imageSrc: "/getting-started/SO_5.png",
        imageAlt: "Consistent SO numbering and wording",
      },
    ],
    routes: {
      admin: "/programchair/student-outcomes",
    },
  },
  {
    id: "courses",
    title: "Courses",
    icon: BookOpen,
    summary: "Map each course to the Student Outcomes it should assess.",
    previewTitle: "Course to Student Outcome Mapping",
    previewMetrics: [
      { label: "Course", value: "Code" },
      { label: "Mapped SOs", value: "Links" },
      { label: "Coverage", value: "Scope" },
      { label: "Status", value: "Ready" },
    ],
    howItWorks: [
      {
        text: "Select a course card and assign relevant SOs using the edit button.",
        imageSrc: "/getting-started/Courses_1.png",
        imageAlt: "Select course card and map SOs",
      },
      {
        text: "Validate mappings before assessments begin.",
        imageSrc: "/getting-started/Courses_2.png",
        imageAlt: "Validate course and SO mappings",
      },
      {
        text: "Use mappings to filter and organize the Assessment workflow.",
        imageSrc: "/getting-started/Courses_3.png",
        imageAlt: "Use mappings in assessment workflow",
      },
      {
        text: "Ensure each course has meaningful SO coverage.",
        imageSrc: "/getting-started/Courses_4.png",
        imageAlt: "Course SO coverage overview",
      },
      {
        text: "Update mappings whenever curriculum revisions are applied.",
        imageSrc: "/getting-started/Courses_5.png",
        imageAlt: "Update mappings after curriculum revision",
      },
    ],
    routes: {
      admin: "/programchair/courses",
    },
  },
  {
    id: "classes",
    title: "Classes",
    icon: Users,
    summary: "Manage sections, faculty assignments, and student rosters.",
    previewTitle: "Class and Roster Management",
    previewMetrics: [
      { label: "Section", value: "Class" },
      { label: "Faculty", value: "Assigned" },
      { label: "Students", value: "Roster" },
      { label: "Import", value: "CSV" },
    ],
    howItWorks: [
      {
        text: "Click Add Section to create a new section.",
        imageSrc: "/getting-started/Classes_1.png",
        imageAlt: "Add Section button",
      },
      {
        text: "Create or edit sections and assign faculty where needed.",
        imageSrc: "/getting-started/Classes_2.png",
        imageAlt: "Create or edit sections and assign faculty",
      },
      {
        text: "Maintain student lists manually or through CSV import.",
        imageSrc: "/getting-started/Classes_3.png",
        imageAlt: "Maintain student list with manual and CSV options",
      },
      {
        text: "Use filters to quickly find sections, faculty, or students.",
        imageSrc: "/getting-started/Classes_4.png",
        imageAlt: "Filter classes, faculty, and students",
      },
      {
        text: "Expand a class to verify students and assignment details.",
        imageSrc: "/getting-started/Classes_5.png",
        imageAlt: "Expanded class details",
      },
      {
        text: "This page auto-saves your updates, so your changes are stored immediately while you work. Still review section details before leaving to confirm everything is correct.",
        imageSrc: "/getting-started/Classes_6.png",
        imageAlt: "Auto-save class updates",
      },
    ],
    routes: {
      admin: "/programchair/classes",
      staff: "/faculty/classes",
    },
  },
  {
    id: "assessment",
    title: "Assessment",
    icon: ClipboardCheck,
    summary: "Input rubric scores for students per section and Student Outcome.",
    previewTitle: "Assessment Encoding Workspace",
    previewMetrics: [
      { label: "Section", value: "Selected" },
      { label: "Outcome", value: "SO" },
      { label: "Rubric", value: "Criteria" },
      { label: "Save", value: "Progress" },
    ],
    howItWorks: [
      {
        text: "Choose a course or section, then pick the SO to evaluate.",
        imageSrc: "/getting-started/Assessment_1.png",
        imageAlt: "Select course or section and SO",
      },
      {
        text: "Click Assess Students to view the mapped SOs for the selected class and start scoring.",
        imageSrc: "/getting-started/Assessment_2.png",
        imageAlt: "Assess Students and mapped SO view",
      },
      {
        text: "Enter rubric-based scores for indicators and criteria.",
        imageSrc: "/getting-started/Assessment_3.png",
        imageAlt: "Enter rubric-based scores",
      },
      {
        text: "Save scores to keep completion status and analytics up to date.",
        imageSrc: "/getting-started/Assessment_4.png",
        imageAlt: "Save assessment scores",
      },
      {
        text: "Complete all required fields to avoid incomplete status.",
        imageSrc: "/getting-started/Assessment_5.png",
        imageAlt: "Complete required assessment fields",
      },
      {
        text: "Review encoded scores before finalizing each section.",
        imageSrc: "",
        imageAlt: "Review encoded scores",
      },
    ],
    routes: {
      admin: "/programchair/assessment",
      staff: "/faculty/assessments",
    },
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChart3,
    summary: "Analyze attainment, trends, and export results for review.",
    previewTitle: "Course and Outcome Reports",
    previewMetrics: [
      { label: "Summary", value: "Tables" },
      { label: "Charts", value: "Visuals" },
      { label: "Attainment", value: "Rate" },
      { label: "Export", value: "PDF/CSV" },
    ],
    howItWorks: [
      {
        text: "Apply filters such as school year, course, section, or outcome.",
        imageSrc: "/getting-started/Reports_1.png",
        imageAlt: "Apply report filters",
      },
      {
        text: "Review visual summaries and tables for decision-making.",
        imageSrc: "/getting-started/Reports_2.png",
        imageAlt: "Review report visuals and tables",
      },
      {
        text: "Export outputs for meetings, audits, and documentation.",
        imageSrc: "/getting-started/Reports_3.png",
        imageAlt: "Export report outputs",
      },
      {
        text: "Track trends to identify strengths and weak areas.",
        imageSrc: "/getting-started/Reports_4.png",
        imageAlt: "Track report trends",
      },
      {
        text: "Use generated summaries for accreditation and planning.",
        imageSrc: "/getting-started/Reports_5.png",
        imageAlt: "Generated summaries for planning",
      },
    ],
    routes: {
      admin: "/programchair/reports",
      staff: "/faculty/reports",
    },
  },
];

const ROLE_GUIDE_IDS = {
  admin: ["dashboard", "student-outcomes", "courses", "classes", "assessment", "reports"],
  staff: ["dashboard", "classes", "assessment", "reports"],
};

const resolveCurrentGuideId = (pathname) => {
  if (pathname.startsWith("/programchair/student-outcomes")) return "student-outcomes";
  if (pathname.startsWith("/programchair/courses")) return "courses";
  if (pathname.startsWith("/programchair/classes") || pathname.startsWith("/faculty/classes")) return "classes";
  if (
    pathname.startsWith("/programchair/assessment") ||
    pathname.startsWith("/assessment/") ||
    pathname.startsWith("/faculty/assessments")
  ) {
    return "assessment";
  }
  if (
    pathname.startsWith("/programchair/reports") ||
    pathname.startsWith("/programchair/past-reports") ||
    pathname.startsWith("/faculty/reports") ||
    pathname.startsWith("/faculty/past-reports")
  ) {
    return "reports";
  }
  if (pathname.startsWith("/programchair/dashboard") || pathname.startsWith("/faculty/dashboard")) {
    return "dashboard";
  }

  return "dashboard";
};

const GettingStartedModal = ({ open, onOpenChange, userRole, pathname, onDismiss }) => {
  const currentGuideId = useMemo(() => resolveCurrentGuideId(pathname || ""), [pathname]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const guidesForRole = useMemo(() => {
    const roleGuideIds = ROLE_GUIDE_IDS[userRole];
    if (!roleGuideIds || roleGuideIds.length === 0) {
      return PAGE_GUIDES;
    }

    return roleGuideIds
      .map((guideId) => PAGE_GUIDES.find((guide) => guide.id === guideId))
      .filter(Boolean);
  }, [userRole]);

  useEffect(() => {
    if (open) {
      const initialIndex = guidesForRole.findIndex((guide) => guide.id === currentGuideId);
      setActiveIndex(initialIndex >= 0 ? initialIndex : 0);
      setDoNotShowAgain(false);
    }
  }, [open, currentGuideId, guidesForRole]);

  const activeGuide = guidesForRole[activeIndex] || guidesForRole[0] || PAGE_GUIDES[0];
  const Icon = activeGuide.icon;
  const guideSteps = useMemo(
    () =>
      (activeGuide.howItWorks || []).map((step, index) => {
        if (typeof step === "string") {
          return {
            text: step,
            imageSrc: "",
            imageAlt: `${activeGuide.title} step ${index + 1}`,
          };
        }

        return {
          text: step.text || "",
          imageSrc: step.imageSrc || "",
          imageAlt: step.imageAlt || `${activeGuide.title} step ${index + 1}`,
        };
      }),
    [activeGuide]
  );

  const handleDialogOpenChange = (nextOpen) => {
    if (!nextOpen) {
      onDismiss?.({ dontShowAgain: doNotShowAgain });
    }

    onOpenChange(nextOpen);
  };

  const handlePrevious = () => {
    setActiveIndex((previous) => Math.max(previous - 1, 0));
  };

  const handleNext = () => {
    if (activeIndex >= guidesForRole.length - 1) {
      handleDialogOpenChange(false);
      return;
    }

    setActiveIndex((previous) => Math.min(previous + 1, guidesForRole.length - 1));
  };

  const openImagePreview = (src, alt) => {
    if (!src) return;
    setPreviewImage({ src, alt });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const isFirstFeature = activeIndex === 0;
  const isLastFeature = activeIndex === guidesForRole.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="h-[85vh] max-h-[720px] w-[92vw] max-w-4xl overflow-hidden rounded-xl border border-[#666666] p-0">
        <div className="flex h-full min-h-0 flex-col bg-[#F5F5F0]">
          <div className="border-b border-[#A5A8AB] bg-[#231F20] px-5 py-4">
            <div className="pr-8">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-white/10 p-2 text-[#FFC20E]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A5A8AB]">Getting Started</p>
                  <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                    <span className="text-white">Guide: </span>
                    <span className="text-[#FFC20E]">{activeGuide.title}</span>
                  </h2>
                  <p className="text-xs font-medium text-[#A5A8AB]">
                    Feature {activeIndex + 1} of {guidesForRole.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-4">
            <p className="shrink-0 text-sm leading-relaxed text-[#6B6B6B] sm:text-base">{activeGuide.summary}</p>

            <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-lg border border-[#666666] bg-white p-4">
              <div className="mb-4 shrink-0 flex items-center gap-2 text-[#231F20]">
                <CircleCheck className="h-5 w-5 text-[#FFC20E]" />
                <h3 className="text-base font-semibold sm:text-lg">How to use it:</h3>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {guideSteps.map((step, index) => (
                  <div key={`${activeGuide.id}-step-${index + 1}`} className="space-y-2 pb-3 text-sm leading-relaxed text-[#6B6B6B] last:pb-0">
                    <p>
                      <span className="font-semibold text-[#231F20]">{index + 1}. </span>
                      {step.text}
                    </p>

                    {step.imageSrc ? (
                      <button
                        type="button"
                        onClick={() => openImagePreview(step.imageSrc, step.imageAlt)}
                        aria-label={`Preview image for step ${index + 1}`}
                        className="block w-full"
                      >
                        <div className="h-36 w-full rounded-md border border-[#D1D5DB] bg-[#F5F5F5] p-1 transition-colors hover:border-[#A5A8AB] sm:h-44">
                          <img
                            src={step.imageSrc}
                            alt={step.imageAlt}
                            loading="lazy"
                            className="h-full w-full cursor-zoom-in object-contain"
                          />
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-[#A5A8AB] bg-[#F5F5F5] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">
                        Image Placeholder
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#A5A8AB] bg-white px-5 py-4">
            <div className="flex flex-col gap-3 md:grid md:grid-cols-[auto_1fr_auto] md:items-center">
              <label className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] select-none md:justify-self-start">
                <input
                  type="checkbox"
                  checked={doNotShowAgain}
                  onChange={(event) => setDoNotShowAgain(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border border-[#A5A8AB] accent-[#FFC20E]"
                />
                <span>Don&apos;t show this again</span>
              </label>

              <div className="flex items-center justify-center gap-2 md:justify-self-center">
                {guidesForRole.map((guide, index) => (
                  <button
                    type="button"
                    key={`guide-dot-${guide.id}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Go to feature ${index + 1}`}
                    aria-current={index === activeIndex ? "true" : "false"}
                    className={
                      index === activeIndex
                        ? "h-2.5 w-2.5 rounded-full border border-[#231F20] bg-[#231F20] transition-all duration-200"
                        : "h-2.5 w-2.5 rounded-full border border-[#A5A8AB] bg-transparent transition-all duration-200 hover:border-[#6B6B6B] hover:bg-[#E5E7EB]"
                    }
                  />
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 md:justify-self-end">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isFirstFeature}
                  className="rounded-lg border border-[#A5A8AB] px-4 py-2 text-sm font-semibold text-[#231F20] transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-lg bg-[#FFC20E] px-4 py-2 text-sm font-semibold text-[#231F20] transition-colors hover:bg-[#FFCE39]"
                >
                  {isLastFeature ? "Done" : "Next"}
                  {!isLastFeature ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </div>
            </div>
          </div>
        </div>

        {previewImage ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
            onClick={closeImagePreview}
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
          >
            <div
              className="relative w-full max-w-5xl rounded-lg bg-white p-3 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeImagePreview}
                className="absolute right-3 top-3 rounded-md border border-[#A5A8AB] bg-white px-3 py-1 text-sm font-semibold text-[#231F20] hover:bg-[#F5F5F5]"
              >
                Close
              </button>

              <img
                src={previewImage.src}
                alt={previewImage.alt || "Step preview image"}
                className="max-h-[80vh] w-full rounded-md object-contain"
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default GettingStartedModal;
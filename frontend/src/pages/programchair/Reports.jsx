import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import StatCards from "@/components/reports/StatCards.jsx";
import SOPerformance from "@/components/reports/SOPerformance.jsx";
import CourseSummary from "@/components/reports/CourseSummary.jsx";
import SOSummaryTables from "@/components/reports/SOSummaryTables.jsx";
import ReportsFilter from "@/components/reports/reportsfilter.jsx";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, BookOpen, FileDown, History, Loader2, Tag } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const AUTH_STORAGE_KEYS = ["accessToken", "refreshToken", "userRole"];

const getStoredToken = (key) => {
  const value = localStorage.getItem(key);
  if (!value || value === "undefined" || value === "null") {
    return null;
  }
  return value;
};

const parseJwtPayload = (token) => {
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      return null;
    }

    const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  // Refresh a few seconds early to avoid race conditions between check and request.
  const expiresAt = payload.exp * 1000;
  return expiresAt <= Date.now() + 5000;
};

const refreshAccessToken = async () => {
  const refreshToken = getStoredToken("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
      refresh: refreshToken,
    });

    const nextAccessToken = response.data?.access;
    if (!nextAccessToken) {
      return null;
    }

    localStorage.setItem("accessToken", nextAccessToken);
    return nextAccessToken;
  } catch {
    return null;
  }
};

const clearAuthSession = () => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportContentRef = useRef(null);
  const hasHandledAuthFailureRef = useRef(false);
  const [reportMode, setReportMode] = useState("so");
  const [filters, setFilters] = useState({
    schoolYear: "",
    course: "",
    section: "",
    outcome: ""
  });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleSessionExpired = useCallback(
    (description) => {
      if (hasHandledAuthFailureRef.current) {
        return;
      }

      hasHandledAuthFailureRef.current = true;
      clearAuthSession();
      toast({
        title: "Session expired",
        description: description || "Please sign in again to continue.",
        variant: "destructive",
      });
      navigate("/");
    },
    [navigate, toast]
  );

  const makeAuthorizedRequest = useCallback(async (requestConfig) => {
    let accessToken = getStoredToken("accessToken");
    if (!accessToken || isTokenExpired(accessToken)) {
      accessToken = await refreshAccessToken();
    }

    if (!accessToken) {
      const authError = new Error("Authentication required");
      authError.code = "AUTH_REQUIRED";
      throw authError;
    }

    const executeRequest = (token) =>
      axios({
        ...requestConfig,
        headers: {
          ...(requestConfig.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

    try {
      return await executeRequest(accessToken);
    } catch (error) {
      if (error.response?.status === 401) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return executeRequest(refreshedToken);
        }
      }

      throw error;
    }
  }, []);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.schoolYear) params.school_year = filters.schoolYear;
      if (filters.course) params.course = filters.course;
      if (filters.section) params.section = filters.section;
      if (filters.outcome) params.so = filters.outcome;

      const res = await makeAuthorizedRequest({
        method: "get",
        url: `${API_BASE_URL}/reports/dashboard/`,
        params,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error loading report data:", err);

      if (err.code === "AUTH_REQUIRED" || err.response?.status === 401) {
        handleSessionExpired("Please sign in again to load the latest report data.");
        return;
      }

      toast({
        title: "Unable to load reports",
        description: err.response?.data?.detail || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, handleSessionExpired, makeAuthorizedRequest, toast]);

  const handleSaveSummaryTable = useCallback(
    async (tablePayload) => {
      try {
        const payload = {
          so_id: tablePayload.so_id,
          school_year: filters.schoolYear || "",
          course_id: filters.course || null,
          section_id: filters.section || null,
          formula: tablePayload.formula,
          variables: tablePayload.variables,
          table_data: tablePayload.table_data,
        };

        const res = await makeAuthorizedRequest({
          method: "post",
          url: `${API_BASE_URL}/reports/save_summary_table/`,
          data: payload,
        });
        const savedTemplate = res.data?.report_template;

        setData((current) => {
          if (!current) return current;
          return {
            ...current,
            so_summary_tables: (current.so_summary_tables || []).map((table) =>
              table.so_id === tablePayload.so_id
                ? {
                    ...tablePayload.table_data,
                    so_id: tablePayload.so_id,
                    report_config_id: savedTemplate?.id ?? table.report_config_id ?? null,
                    formula: tablePayload.formula,
                    variables: tablePayload.variables,
                  }
                : table
            ),
          };
        });

        toast({
          title: "Report summary saved",
          description: `SO ${tablePayload.so_number} customizations are now stored in the backend.`,
        });

        return savedTemplate;
      } catch (err) {
        if (err.code === "AUTH_REQUIRED" || err.response?.status === 401) {
          handleSessionExpired("Please sign in again before saving summary table changes.");
          return null;
        }

        toast({
          title: "Save failed",
          description: err.response?.data?.detail || "Unable to save summary table changes right now.",
          variant: "destructive",
        });
        throw err;
      }
    },
    [filters.course, filters.schoolYear, filters.section, handleSessionExpired, makeAuthorizedRequest, toast]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!showFinalizeModal) {
      setCountdown(10);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showFinalizeModal]);

  const handleExportReport = useCallback(() => {
    if (!data || !reportContentRef.current) {
      toast({
        title: "No report to export",
        description: "Load report data first before exporting.",
        variant: "destructive",
      });
      return;
    }

    const exportWindow = window.open("", "_blank", "width=1280,height=900");
    if (!exportWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups for this site to export the report as PDF.",
        variant: "destructive",
      });
      return;
    }

    const filtersSummary = [
      filters.schoolYear ? `School Year: ${filters.schoolYear}` : null,
      filters.course
        ? `Course: ${
            data.filter_options?.courses?.find((course) => String(course.id) === String(filters.course))
              ?.code || filters.course
          }`
        : null,
      filters.section
        ? `Section: ${
            data.filter_options?.sections?.find((section) => String(section.id) === String(filters.section))
              ?.name || filters.section
          }`
        : null,
      filters.outcome
        ? `Student Outcome: SO ${
            data.filter_options?.student_outcomes?.find((so) => String(so.id) === String(filters.outcome))
              ?.number || filters.outcome
          }`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const reportMarkup = reportContentRef.current.innerHTML;

    exportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Assessment Reports Export</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #231f20;
              background: #ffffff;
            }
            .page {
              padding: 32px;
            }
            .export-header {
              border-bottom: 2px solid #231f20;
              margin-bottom: 24px;
              padding-bottom: 16px;
            }
            .export-header h1 {
              margin: 0 0 8px;
              font-size: 28px;
            }
            .export-header p {
              margin: 0;
              color: #555;
              font-size: 14px;
              line-height: 1.5;
            }
            .grid, .recharts-responsive-container {
              width: 100% !important;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              vertical-align: top;
            }
            .glass-card {
              border: 1px solid #d1d5db;
              border-radius: 12px;
              padding: 20px;
              background: #fff;
              break-inside: avoid;
              margin-bottom: 20px;
            }
            button, textarea, input, select {
              border: 0;
              background: transparent;
              color: inherit;
              font: inherit;
              padding: 0;
            }
            textarea, input {
              width: 100%;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .page { padding: 16px; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="export-header">
              <h1>Assessment Reports & Performance Summary</h1>
              <p>Generated from the Program Chair reports page.</p>
              <p>${filtersSummary || "All available report data"}</p>
            </div>
            ${reportMarkup}
          </div>
        </body>
      </html>
    `);
    exportWindow.document.close();
    exportWindow.focus();

    setTimeout(() => {
      exportWindow.print();
    }, 500);
  }, [data, filters.course, filters.outcome, filters.schoolYear, filters.section, toast]);

  const handleFinalizeSemester = useCallback(async () => {
    setIsFinalizing(true);
    try {
      await makeAuthorizedRequest({
        method: "post",
        url: `${API_BASE_URL}/reports/finalize_semester/`,
        data: {},
      });

      setShowFinalizeModal(false);
      await fetchReport();
      toast({
        title: "Semester finalized",
        description: "Active sections were archived to Past Reports and cleared from the live report set.",
      });
      navigate("/programchair/past-reports");
    } catch (err) {
      if (err.code === "AUTH_REQUIRED" || err.response?.status === 401) {
        handleSessionExpired("Please sign in again before finalizing the semester.");
        return;
      }

      toast({
        title: "Finalization failed",
        description: err.response?.data?.detail || "Unable to finalize the semester right now.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  }, [fetchReport, handleSessionExpired, makeAuthorizedRequest, navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              REPORTS & ANALYTICS
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-white">Assessment Reports</span>
              <br />
              <span className="text-[#FFC20E]">& Performance Summary</span>
            </h1>

            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6 sm:mb-8">
              Overview of student outcomes and course performance across selected filters.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowFinalizeModal(true)}
                disabled={isLoading || isFinalizing}
                className="flex items-center gap-2 bg-[#C62828] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#B71C1C] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>FINALIZE SEMESTER</span>
              </button>

              <button
                onClick={() => navigate("/programchair/past-reports")}
                className="flex items-center gap-2 bg-white text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>VIEW PAST REPORTS</span>
              </button>

              <button
                onClick={handleExportReport}
                disabled={!data || isLoading}
                className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>EXPORT AS PDF</span>
              </button>

              <div className="inline-flex items-center rounded-xl bg-[#3A3A3A] p-1">
                <button
                  onClick={() => setReportMode("so")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    reportMode === "so"
                      ? "bg-[#FFC20E] text-[#231F20]"
                      : "text-[#A5A8AB] hover:text-white"
                  }`}
                >
                  <Tag className="h-4 w-4" />
                  SO Level
                </button>
                <button
                  onClick={() => setReportMode("course")}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    reportMode === "course"
                      ? "bg-[#FFC20E] text-[#231F20]"
                      : "text-[#A5A8AB] hover:text-white"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Course Level
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ReportsFilter
            filters={filters}
            setFilters={setFilters}
            filterOptions={data?.filter_options}
          />

        </div>

        {/* Report Content */}
        <div ref={reportContentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6 sm:space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#FFC20E]" />
              <span className="ml-3 text-[#6B6B6B]">Loading report data...</span>
            </div>
          ) : data ? (
            <>
              <StatCards metrics={data.metrics} />
              {reportMode === "so" ? (
                <>
                  <SOSummaryTables
                    tables={data.so_summary_tables || []}
                    onSaveTable={handleSaveSummaryTable}
                    schoolYearOptions={data.filter_options?.school_years || []}
                  />
                  <SOPerformance soData={data.so_performance || []} />
                </>
              ) : (
                <CourseSummary courses={data.course_summary || []} />
              )}
            </>
          ) : (
            <div className="text-center py-16 text-[#A5A8AB]">
              <p className="text-lg">No report data available.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-[#E5E7EB] px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-100 p-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#231F20]">Finalize this semester?</h2>
                  <p className="mt-1 text-sm text-[#6B6B6B]">
                    This will archive the current active report data and remove all current active sections from the live system.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm text-[#4D4741]">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="font-semibold text-red-800">Warning</p>
                <p className="mt-1 text-red-700">
                  After finalization, the Program Chair will need to create new course offerings and sections again before the next semester can be assessed.
                </p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                <p>The system will:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Save the current live report snapshot into Past Reports.</li>
                  <li>Remove all active sections so they no longer appear in current reports and assessments.</li>
                  <li>Require a fresh setup for the next semester’s sections.</li>
                </ul>
              </div>

              <p className="text-xs uppercase tracking-[0.2em] text-[#A5A8AB]">
                Confirmation unlocks in {countdown} second{countdown === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#E5E7EB] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={() => !isFinalizing && setShowFinalizeModal(false)}
                className="rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isFinalizing}
              >
                Cancel
              </button>
              <button
                onClick={handleFinalizeSemester}
                disabled={countdown > 0 || isFinalizing}
                className="rounded-lg bg-[#C62828] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#B71C1C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFinalizing ? "Finalizing..." : "Finalize Semester Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

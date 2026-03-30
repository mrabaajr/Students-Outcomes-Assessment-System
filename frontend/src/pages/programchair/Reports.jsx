import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import StatCards from "@/components/reports/StatCards.jsx";
import SOPerformance from "@/components/reports/SOPerformance.jsx";
import CourseSummary from "@/components/reports/CourseSummary.jsx";
import SOSummaryTables from "@/components/reports/SOSummaryTables.jsx";
import ReportsFilter from "@/components/reports/ReportsFilter.jsx";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, FileDown, Loader2, Tag } from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

export default function Reports() {
  const { toast } = useToast();
  const reportContentRef = useRef(null);
  const [reportMode, setReportMode] = useState("so");
  const [filters, setFilters] = useState({
    schoolYear: "",
    course: "",
    section: "",
    outcome: ""
  });

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filters.schoolYear) params.school_year = filters.schoolYear;
      if (filters.course) params.course = filters.course;
      if (filters.section) params.section = filters.section;
      if (filters.outcome) params.so = filters.outcome;

      const res = await axios.get(`${API_BASE_URL}/reports/dashboard/`, { params });
      setData(res.data);
    } catch (err) {
      console.error("Error loading report data:", err);
    }
    setIsLoading(false);
  }, [filters]);

  const handleSaveSummaryTable = useCallback(
    async (tablePayload) => {
      const payload = {
        so_id: tablePayload.so_id,
        school_year: filters.schoolYear || "",
        course_id: filters.course || null,
        section_id: filters.section || null,
        formula: tablePayload.formula,
        variables: tablePayload.variables,
        table_data: tablePayload.table_data,
      };

      const res = await axios.post(`${API_BASE_URL}/reports/save_summary_table/`, payload);
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
    },
    [filters.course, filters.schoolYear, filters.section, toast]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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
    </div>
  );
}

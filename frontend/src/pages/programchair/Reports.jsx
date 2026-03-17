import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import StatCards from "@/components/reports/StatCards.jsx";
import SOPerformance from "@/components/reports/SOPerformance.jsx";
import CourseSummary from "@/components/reports/CourseSummary.jsx";
import SOSummaryTables from "@/components/reports/SOSummaryTables.jsx";
import ReportsFilter from "@/components/reports/ReportsFilter.jsx";
import { FileDown, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

export default function Reports() {
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

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

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

            <button className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors">
              <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>EXPORT AS FILE</span>
            </button>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6 sm:space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-[#FFC20E]" />
              <span className="ml-3 text-[#6B6B6B]">Loading report data...</span>
            </div>
          ) : data ? (
            <>
              <StatCards metrics={data.metrics} />
              <SOSummaryTables tables={data.so_summary_tables || []} />
              <SOPerformance soData={data.so_performance || []} />
              <CourseSummary courses={data.course_summary || []} />
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

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Download, FileText, Eye, Calendar, Filter, Search, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import SOSummaryTables from "@/components/reports/SOSummaryTables.jsx";
import {
  buildPastReportFilterOptions,
  downloadSamplePastReport,
} from "../../data/pastReportsData";
import { API_BASE_URL } from "@/lib/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function ProgramChairPastReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const filterOptions = useMemo(
    () => buildPastReportFilterOptions(reports),
    [reports]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("All Years");
  const [selectedReportType, setSelectedReportType] = useState("All Types");
  const [viewDetailsId, setViewDetailsId] = useState(null);

  useEffect(() => {
    const loadPastReports = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/reports/past_reports/`, {
          headers: getAuthHeaders(),
        });
        setReports(response.data?.reports || []);
      } catch (error) {
        console.error("Failed to load past reports:", error);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPastReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.semester.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear =
        selectedSchoolYear === "All Years" || report.schoolYear === selectedSchoolYear;
      const matchesType =
        selectedReportType === "All Types" || report.reportType === selectedReportType;

      return matchesSearch && matchesYear && matchesType;
    });
  }, [reports, searchQuery, selectedSchoolYear, selectedReportType]);

  const handleViewDetails = (reportId) => {
    setViewDetailsId(viewDetailsId === reportId ? null : reportId);
  };

  const handleDownload = (report) => {
    downloadSamplePastReport(report, "Program Chair");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              REPORTS & ANALYTICS
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-white">Past</span>
              <br />
              <span className="text-[#FFC20E]">Reports</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6">
              Review and download previously generated program chair reports across school years and report types.
            </p>
            <button
              onClick={() => navigate("/programchair/reports")}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-[#FFC20E] rounded-lg text-[#FFC20E] font-medium hover:bg-[#FFC20E]/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Current Reports</span>
            </button>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-[#A5A8AB]" />
              <input
                type="text"
                placeholder="Search reports by title or semester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[#231F20] placeholder-[#A5A8AB] focus:border-[#FFC20E] focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#A5A8AB]" />
                <span className="text-sm text-[#A5A8AB] font-medium">Filter by:</span>
              </div>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="bg-white text-[#231F20] text-sm rounded-lg px-4 py-2 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
              >
                {filterOptions.schoolYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="bg-white text-[#231F20] text-sm rounded-lg px-4 py-2 border border-gray-200 focus:border-[#FFC20E] focus:outline-none"
              >
                {filterOptions.reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 text-sm text-[#A5A8AB]">
            Showing <span className="font-semibold text-[#231F20]">{filteredReports.length}</span> report{filteredReports.length !== 1 ? "s" : ""}
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="glass-card p-6 sm:p-8 text-center">
                <p className="text-[#231F20] font-medium mb-1">Loading archived reports...</p>
              </div>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="glass-card overflow-hidden">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0 mt-1">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#231F20] break-words">{report.title}</h3>
                          <p className="text-xs text-[#A5A8AB] mt-1">
                            {report.semester} • {report.reportType}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          report.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {report.status === "Completed" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {report.status}
                      </span>

                      <button
                        onClick={() => handleViewDetails(report.id)}
                        className="flex items-center justify-center p-2 rounded-lg transition-colors text-[#A5A8AB] hover:bg-[#FFC20E]/10 hover:text-[#FFC20E]"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleDownload(report)}
                        className="flex items-center justify-center p-2 rounded-lg transition-colors bg-[#FFC20E]/10 text-[#FFC20E] hover:bg-[#FFC20E]/20"
                        title="Download Report"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {viewDetailsId === report.id && (
                    <div className="border-t border-[#E5E5E5] bg-[#F9F9F9] p-4 sm:p-5 space-y-6">
                      <div className="glass-card p-5 sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF6D8] px-3 py-1 text-xs font-semibold text-[#8A6A00]">
                              <Calendar className="h-3.5 w-3.5" />
                              Archived Report Snapshot
                            </div>
                            <h2 className="mt-3 text-xl font-semibold text-[#231F20]">{report.title}</h2>
                            <p className="mt-2 text-sm text-[#6B6B6B]">
                              {report.schoolYear} • {report.semester} • {report.reportType}
                            </p>
                            <p className="mt-3 text-sm text-[#4D4741] max-w-3xl">{report.summary}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm text-[#231F20] sm:min-w-[280px]">
                            <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3">
                              <p className="text-xs uppercase text-[#A5A8AB]">Submitted</p>
                              <p className="mt-1 font-medium">{new Date(report.dateSubmitted).toLocaleDateString()}</p>
                            </div>
                            <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3">
                              <p className="text-xs uppercase text-[#A5A8AB]">Average Score</p>
                              <p className="mt-1 font-medium">{report.avgScore}%</p>
                            </div>
                            <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3">
                              <p className="text-xs uppercase text-[#A5A8AB]">Courses</p>
                              <p className="mt-1 font-medium">{report.coursesAssessed}</p>
                            </div>
                            <div className="rounded-lg border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3">
                              <p className="text-xs uppercase text-[#A5A8AB]">Students</p>
                              <p className="mt-1 font-medium">{report.studentsAssessed}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <SOSummaryTables
                        tables={report.soSummaryTables || []}
                        schoolYearOptions={[report.schoolYear]}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="glass-card p-6 sm:p-8 text-center">
                <FileText className="w-12 h-12 text-[#A5A8AB] mx-auto mb-4 opacity-50" />
                <p className="text-[#231F20] font-medium mb-1">No reports found</p>
                <p className="text-sm text-[#A5A8AB]">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

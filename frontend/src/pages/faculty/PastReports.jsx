import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, Eye, Calendar, Filter, Search, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import {
  buildPastReportFilterOptions,
  downloadSamplePastReport,
  facultyPastReports,
} from "../../data/pastReportsData";

const PastReports = () => {
  const navigate = useNavigate();
  const filterOptions = useMemo(
    () => buildPastReportFilterOptions(facultyPastReports),
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("All Years");
  const [selectedReportType, setSelectedReportType] = useState("All Types");
  const [viewDetailsId, setViewDetailsId] = useState(null);

  const filteredReports = useMemo(() => {
    return facultyPastReports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.semester.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear =
        selectedSchoolYear === "All Years" || report.schoolYear === selectedSchoolYear;
      const matchesType =
        selectedReportType === "All Types" || report.reportType === selectedReportType;

      return matchesSearch && matchesYear && matchesType;
    });
  }, [searchQuery, selectedSchoolYear, selectedReportType]);

  const handleViewDetails = (reportId) => {
    setViewDetailsId(viewDetailsId === reportId ? null : reportId);
  };

  const handleDownload = (report) => {
    downloadSamplePastReport(report, "Faculty");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB] pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-10 sm:pb-14 lg:pb-16">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              FACULTY PORTAL
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-white">Past</span>
              <br />
              <span className="text-[#FFC20E]">Reports</span>
            </h1>
            <p className="text-sm sm:text-base text-[#A5A8AB] max-w-xl mb-6">
              View and download all previously submitted assessment reports. Filter by school year or report type to find what you need.
            </p>
            <button
              onClick={() => navigate("/faculty/reports")}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-[#FFC20E] rounded-lg text-[#FFC20E] font-medium hover:bg-[#FFC20E]/10 transition-colors"
              title="Back to Current Reports"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Current Reports</span>
            </button>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Filters Section */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
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

            {/* Filter Controls */}
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

          {/* Results Count */}
          <div className="mb-4 text-sm text-[#A5A8AB]">
            Showing <span className="font-semibold text-[#231F20]">{filteredReports.length}</span> report{filteredReports.length !== 1 ? "s" : ""}
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="glass-card overflow-hidden">
                  {/* Report Header */}
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

                  {/* Report Details (Expandable) */}
                  {viewDetailsId === report.id && (
                    <div className="border-t border-[#E5E5E5] bg-[#F9F9F9] p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">School Year</p>
                          <p className="text-sm font-medium text-[#231F20]">{report.schoolYear}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">Submitted</p>
                          <p className="text-sm font-medium text-[#231F20]">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            {new Date(report.dateSubmitted).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">Courses Assessed</p>
                          <p className="text-sm font-medium text-[#231F20]">{report.coursesAssessed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">Students</p>
                          <p className="text-sm font-medium text-[#231F20]">{report.studentsAssessed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">Average Score</p>
                          <p className="text-sm font-medium text-[#231F20]">{report.avgScore}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">Format</p>
                          <p className="text-sm font-medium text-[#231F20]">{report.fileFormat}</p>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-4">
                          <p className="text-xs text-[#A5A8AB] font-semibold uppercase mb-1">Summary</p>
                          <p className="text-sm text-[#231F20]">{report.summary}</p>
                        </div>
                      </div>
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
};

export default PastReports;

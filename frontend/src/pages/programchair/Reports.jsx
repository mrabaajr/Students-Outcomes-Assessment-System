import Navbar from "../../components/dashboard/Navbar";
import Footer from "../../components/dashboard/Footer";
import StatCards from "@/components/reports/StatCards.jsx";
import SOPerformance from "@/components/reports/SOPerformance.jsx";
import CourseSummary from "@/components/reports/CourseSummary.jsx";
import AssessmentCompletion from "@/components/reports/AssessmentCompletion.jsx";
import { FileDown } from "lucide-react";

export default function Reports() {
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
              Overview of student outcomes, course performance, and assessment status across all programs and courses.
            </p>

            <button className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-[#FFC20E]/90 transition-colors">
              <FileDown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>EXPORT AS FILE</span>
            </button>
          </div>
        </section>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          <StatCards />
          <SOPerformance />
          <CourseSummary />
          <AssessmentCompletion />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
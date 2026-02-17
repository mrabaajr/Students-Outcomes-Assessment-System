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
        <section className="bg-[#231F20] border-b border-[#A5A8AB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              REPORTS & ANALYTICS
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Assessment Reports</span>
              <br />
              <span className="text-[#FFC20E]">& Performance Summary</span>
            </h1>

            <p className="text-[#A5A8AB] max-w-xl mb-8">
              Overview of student outcomes, course performance, and assessment status across all programs and courses.
            </p>

            <button className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-6 py-3 rounded-lg font-medium hover:bg-[#FFC20E]/90 transition-colors">
              <FileDown size={18} />
              <span>EXPORT AS FILE</span>
            </button>
          </div>
        </section>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
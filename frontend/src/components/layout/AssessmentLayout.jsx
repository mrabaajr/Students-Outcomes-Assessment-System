import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";
import { AssessmentSidebar } from "./AssessmentSidebar";

export function AssessmentLayout() {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <TopNavbar />
      <div className="flex flex-1">
        <AssessmentSidebar />
        <main className="flex-1 overflow-x-hidden bg-background">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

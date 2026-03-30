import { User, Mail, Building2, BookOpen, Pencil, Trash2 } from "lucide-react";

const FacultyCard = ({ faculty, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#E5E7EB] bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-[#231F20]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#231F20]">{faculty.name}</h3>
            <div className="flex items-center gap-3 text-xs text-[#6B6B6B] mt-0.5 flex-wrap">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3 flex-shrink-0" />{faculty.department}</span>
              <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0" />{faculty.email}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(faculty)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-200 text-[#231F20] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(faculty.id)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-red-50 text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Assigned Courses
        </p>
        {faculty.courses.length === 0 ? (
          <p className="text-sm text-[#6B6B6B] text-center py-4">No courses assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {faculty.courses.map((course) => (
              <div key={course.code} className="flex items-start justify-between bg-gray-50 rounded-md px-3 py-2.5 border border-[#E5E7EB]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#231F20]">{course.code} — {course.name}</p>
                </div>
                <div className="flex flex-wrap gap-1 ml-3 flex-shrink-0">
                  {course.sections.map((sec) => (
                    <span key={sec} className="bg-[#FFC20E]/20 text-[#231F20] text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyCard;

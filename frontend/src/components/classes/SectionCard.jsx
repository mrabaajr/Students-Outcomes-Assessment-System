import { useState } from "react";
import {
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  Upload,
  User
} from "lucide-react";

const SectionCard = ({
  section,
  onEdit,
  onDelete,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onImportCSV, // 🔥 new prop
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#FFC20E] flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-[#231F20]" />
          </div>

          <div>
            <h3 className="font-bold text-base text-[#231F20]">
              {section.name}
            </h3>

            <p className="text-sm text-[#6B6B6B] flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {section.courseCode} — {section.courseName}
            </p>

            {/* 🔥 Faculty Display */}
            <p className="text-xs text-[#6B6B6B] flex items-center gap-1 mt-1">
              <User className="w-3 h-3" />
              {section.facultyName || "No faculty assigned"}
            </p>
            
            {/* StudentOutcomes Display */}
            {section.studentOutcomes && section.studentOutcomes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {section.studentOutcomes.map(so => (
                  <span
                    key={so.id}
                    className="bg-[#FFC20E]/20 text-[#231F20] text-xs font-semibold px-2 py-0.5 rounded-full"
                    title={so.description}
                  >
                    SO {so.number}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-xs gap-1">
            {section.schoolYear && (
              <span className="font-semibold text-[#231F20]">
                SY {section.schoolYear}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-[#FFC20E]/20 text-[#231F20] text-xs font-semibold px-2.5 py-1 rounded-full">
              {section.students.length} students
            </span>

            {expanded ? (
              <ChevronUp className="w-5 h-5 text-[#6B6B6B]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#6B6B6B]" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[#E5E7EB]">
          {/* Actions Bar */}
          <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(section);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#231F20] hover:bg-gray-200 rounded-md transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Section
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(section.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>

            <div className="flex gap-2">
              {/* 🔥 Import CSV Button */}
              <button
                onClick={() => onImportCSV?.(section.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-[#E5E7EB] hover:bg-gray-100 rounded-md transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>

              <button
                onClick={() => onAddStudent(section.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#FFC20E] text-[#231F20] hover:bg-[#FFC20E]/90 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Student
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="px-5 py-3 bg-[#F9FAFB]">
            <div className="grid grid-cols-12 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              <span className="col-span-1">#</span>
              <span className="col-span-3">Name</span>
              <span className="col-span-2">Student ID</span>
              <span className="col-span-2">Course</span>
              <span className="col-span-2">Year Level</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
          </div>

          {/* Students */}
          <ul className="divide-y divide-[#E5E7EB]">
            {section.students.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-[#6B6B6B]">
                No students enrolled yet. Click "Add Student" to get started.
              </li>
            ) : (
              section.students.map((student, idx) => (
                <li
                  key={student.id}
                  className="px-5 py-3 grid grid-cols-12 text-sm items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="col-span-1 text-[#6B6B6B] font-medium">
                    {idx + 1}
                  </span>
                  <span className="col-span-3 font-medium text-[#231F20]">
                    {student.name}
                  </span>
                  <span className="col-span-2 text-[#6B6B6B] font-mono text-xs">
                    {student.studentId}
                  </span>
                  <span className="col-span-2 text-[#6B6B6B]">
                    {student.course}
                  </span>
                  <span className="col-span-2 text-[#6B6B6B]">
                    {student.yearLevel}
                  </span>
                  <span className="col-span-2 flex justify-end gap-1">
                    <button
                      onClick={() => onEditStudent(section.id, student)}
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-200 text-[#231F20] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        onDeleteStudent(section.id, student.id)
                      }
                      className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SectionCard;

import { Check, ChevronDown, Download, FileText, Table2, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SOMappingMatrix = ({ courses, studentOutcomes = [], onToggleMapping, onExport }) => {
  const handleCellClick = (courseId, soId, isMapped) => {
    if (onToggleMapping) {
      onToggleMapping(courseId, soId, !isMapped);
    }
  };

  // Check if a course is mapped to an SO (handle both string and number IDs)
  const isMapped = (course, soId) => {
    const soIdStr = String(soId);
    return course.mappedSOs.some(id => String(id) === soIdStr);
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#231F20] mb-2">Course-to-SO Mapping Matrix</h3>
            <p className="text-sm text-[#6B6B6B]">
              Click on cells to toggle mappings. Yellow indicates a mapped relationship.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={!courses.length || !studentOutcomes.length}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Export Matrix
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onExport?.('csv')} className="gap-2">
                <Table2 className="h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')} className="gap-2">
                <FileText className="h-4 w-4" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {studentOutcomes.length === 0 ? (
        <div className="text-center py-8 text-[#6B6B6B]">
          <p>No Student Outcomes available. Please add some in the Student Outcomes page first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E5E7EB] bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="p-4 text-left font-semibold text-[#231F20] border-b border-[#E5E7EB] sticky left-0 bg-[#F5F5F5] z-10">
                  Course
                </th>
                {studentOutcomes.map((so) => (
                  <th 
                    key={so.id} 
                    className="p-4 text-center font-semibold text-[#231F20] border-b border-[#E5E7EB] min-w-[100px]"
                    title={so.description}
                  >
                    <div className="text-xs">SO {so.number}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="p-4 font-medium text-[#231F20] border-b border-[#E5E7EB] bg-white sticky left-0 z-10">
                    <div>
                      <span className="font-bold">{course.code}</span>
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-1">{course.name}</p>
                  </td>
                  {studentOutcomes.map((so) => {
                    const mapped = isMapped(course, so.id);
                    return (
                      <td 
                        key={so.id}
                        onClick={() => handleCellClick(course.id, so.id, mapped)}
                        className={`p-4 text-center border-b border-[#E5E7EB] cursor-pointer transition-colors ${
                          mapped 
                            ? 'bg-[#FFC20E]/20 hover:bg-[#FFC20E]/30' 
                            : 'bg-white hover:bg-[#F5F5F5]'
                        }`}
                      >
                        {mapped ? (
                          <Check className="h-5 w-5 mx-auto text-[#FFC20E]" />
                        ) : (
                          <X className="h-5 w-5 mx-auto text-[#A5A8AB]/30" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FFC20E]/20 rounded flex items-center justify-center">
            <Check className="h-5 w-5 text-[#FFC20E]" />
          </div>
          <span className="text-sm text-[#6B6B6B]">Mapped to SO</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F5F5F5] rounded flex items-center justify-center">
            <X className="h-5 w-5 text-[#A5A8AB]/30" />
          </div>
          <span className="text-sm text-[#6B6B6B]">Not Mapped</span>
        </div>
      </div>
    </div>
  );
};

export default SOMappingMatrix;

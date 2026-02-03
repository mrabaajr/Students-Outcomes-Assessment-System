import { Check, X } from 'lucide-react';
import { studentOutcomes } from '../../data/mockCoursesData';

const SOMappingMatrix = ({ courses, onToggleMapping }) => {
  const handleCellClick = (courseId, soId, isMapped) => {
    if (onToggleMapping) {
      onToggleMapping(courseId, soId, !isMapped);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#231F20] mb-2">Course-to-SO Mapping Matrix</h3>
        <p className="text-sm text-[#6B6B6B]">
          Click on cells to toggle mappings. Yellow indicates a mapped relationship.
        </p>
      </div>

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
                  <div className="text-xs">{so.code}</div>
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
                  const isMapped = course.mappedSOs.includes(so.id);
                  return (
                    <td 
                      key={so.id}
                      onClick={() => handleCellClick(course.id, so.id, isMapped)}
                      className={`p-4 text-center border-b border-[#E5E7EB] cursor-pointer transition-colors ${
                        isMapped 
                          ? 'bg-[#FFC20E]/20 hover:bg-[#FFC20E]/30' 
                          : 'bg-white hover:bg-[#F5F5F5]'
                      }`}
                    >
                      {isMapped ? (
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

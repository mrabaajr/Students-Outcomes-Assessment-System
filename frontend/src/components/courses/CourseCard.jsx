import { Eye, Pencil, Trash2, BookMarked } from 'lucide-react';
import { Button } from '../ui/button';

const CourseCard = ({ course, onView, onEdit, onDelete }) => {
  return (
    <div className="glass-card p-5 hover-lift">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#231F20] text-lg mb-1">{course.code}</h3>
          <p className="text-sm text-[#6B6B6B]">{course.name}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
          <BookMarked className="h-4 w-4" />
          <span>{course.academicYear}</span>
        </div>
      </div>

      {/* SO Badges */}
      <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
        <p className="text-xs text-[#6B6B6B] mb-2">Mapped SOs:</p>
        <div className="flex flex-wrap gap-1">
          {course.mappedSOs && course.mappedSOs.length > 0 ? (
            course.mappedSOs.map((soId) => (
              <span key={soId} className="bg-[#FFC20E]/20 text-[#231F20] border border-[#FFC20E]/30 text-xs px-2 py-1 rounded font-medium">
                SO {soId}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#A5A8AB] italic">No SOs mapped</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onView(course)} 
          className="flex-1 border-[#E5E7EB] hover:bg-[#F5F5F5] text-[#231F20]"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(course)} 
          className="flex-1 border-[#E5E7EB] hover:bg-[#F5F5F5] text-[#231F20]"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(course)} 
          className="border-[#E5E7EB] hover:bg-destructive/10 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CourseCard;

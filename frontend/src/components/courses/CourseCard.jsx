import { Eye, Pencil, Trash2, Users, BookMarked } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CourseCard = ({ course, onView, onEdit, onDelete }) => {
  return (
    <Card className="bg-card hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">{course.code}</h3>
              <Badge 
                variant={course.status === 'active' ? 'default' : 'secondary'}
                className={course.status === 'active' ? 'bg-success text-success-foreground' : ''}
              >
                {course.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{course.name}</p>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            Section {course.section}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookMarked className="h-4 w-4" />
            <span>{course.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{course.studentCount} Students</span>
          </div>
        </div>

        {/* SO Badges */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Mapped SOs:</p>
          <div className="flex flex-wrap gap-1">
            {course.mappedSOs.length > 0 ? (
              course.mappedSOs.map((so) => (
                <Badge key={so} variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                  {so}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">No SOs mapped</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onView(course)} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(course)} className="flex-1">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(course)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;

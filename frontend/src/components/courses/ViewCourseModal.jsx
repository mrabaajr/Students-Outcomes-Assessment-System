import { BookOpen, Users, Calendar, Building, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { studentOutcomes } from '../../data/mockCoursesData';

const ViewCourseModal = ({ isOpen, onClose, course }) => {
  if (!course) return null;

  const mappedSODetails = studentOutcomes.filter(so => course.mappedSOs.includes(so.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{course.code}</DialogTitle>
              <p className="text-sm text-muted-foreground">{course.name}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={course.status === 'active' ? 'default' : 'secondary'}
              className={course.status === 'active' ? 'bg-success text-success-foreground' : ''}
            >
              {course.status}
            </Badge>
            <span className="text-sm text-muted-foreground">Section {course.section}</span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{course.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-sm font-medium">{course.studentCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Semester</p>
                <p className="text-sm font-medium">{course.semester}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Academic Year</p>
                <p className="text-sm font-medium">{course.academicYear}</p>
              </div>
            </div>
          </div>

          {/* Mapped SOs */}
          <div>
            <h4 className="font-medium mb-3">Mapped Student Outcomes</h4>
            {mappedSODetails.length > 0 ? (
              <div className="space-y-2">
                {mappedSODetails.map((so) => (
                  <div key={so.id} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Badge className="bg-primary text-primary-foreground shrink-0">
                      {so.name}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{so.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                No Student Outcomes mapped to this course.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCourseModal;

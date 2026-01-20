import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { studentOutcomes } from '@/data/mockCoursesData';

const SOMappingMatrix = ({ courses, onToggleMapping }) => {
  const handleCellClick = (courseId, soId, isMapped) => {
    if (onToggleMapping) {
      onToggleMapping(courseId, soId, !isMapped);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Course-to-SO Mapping Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on cells to toggle mappings. Yellow indicates a mapped relationship.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left font-medium text-foreground bg-muted border border-border">
                  Course
                </th>
                {studentOutcomes.map((so) => (
                  <th 
                    key={so.id} 
                    className="p-3 text-center font-medium text-foreground bg-muted border border-border min-w-[80px]"
                    title={so.description}
                  >
                    {so.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="p-3 font-medium text-foreground border border-border bg-card">
                    <div>
                      <span className="font-bold">{course.code}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({course.section})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{course.name}</p>
                  </td>
                  {studentOutcomes.map((so) => {
                    const isMapped = course.mappedSOs.includes(so.id);
                    return (
                      <td 
                        key={so.id}
                        onClick={() => handleCellClick(course.id, so.id, isMapped)}
                        className={`p-3 text-center border border-border cursor-pointer transition-colors ${
                          isMapped 
                            ? 'bg-primary/20 hover:bg-primary/30' 
                            : 'bg-card hover:bg-muted'
                        }`}
                      >
                        {isMapped ? (
                          <Check className="h-5 w-5 mx-auto text-primary" />
                        ) : (
                          <X className="h-5 w-5 mx-auto text-muted-foreground/30" />
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
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Mapped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
              <X className="h-4 w-4 text-muted-foreground/30" />
            </div>
            <span className="text-sm text-muted-foreground">Not Mapped</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SOMappingMatrix;

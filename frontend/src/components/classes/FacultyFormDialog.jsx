import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

const FacultyFormDialog = ({ open, onClose, onSave, initialData }) => {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDepartment(initialData.department);
      setEmail(initialData.email);
      setCourses(initialData.courses.map(c => ({ ...c, sections: [...c.sections] })));
    } else {
      setName(""); setDepartment(""); setEmail(""); setCourses([]);
    }
  }, [initialData, open]);

  const addCourse = () => setCourses([...courses, { code: "", name: "", sections: [] }]);

  const removeCourse = (idx) => setCourses(courses.filter((_, i) => i !== idx));

  const updateCourse = (idx, field, value) => {
    const updated = [...courses];
    if (field === "sections") {
      updated[idx].sections = value.split(",").map(s => s.trim()).filter(Boolean);
    } else {
      updated[idx][field] = value;
    }
    setCourses(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, department, email, courses });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Faculty" : "Add Faculty"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facultyName">Full Name</Label>
            <Input id="facultyName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Roberto Fernandez" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input id="dept" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Computer Science" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. name@tip.edu.ph" required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Courses</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCourse}>
                <Plus className="w-3 h-3 mr-1" /> Add Course
              </Button>
            </div>
            {courses.map((course, idx) => (
              <div key={idx} className="border rounded-md p-3 space-y-2 bg-muted/20 relative">
                <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeCourse(idx)}>
                  <X className="w-3 h-3" />
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Course Code" value={course.code} onChange={e => updateCourse(idx, "code", e.target.value)} />
                  <Input placeholder="Course Name" value={course.name} onChange={e => updateCourse(idx, "name", e.target.value)} />
                </div>
                <Input placeholder="Sections (comma-separated)" value={course.sections.join(", ")} onChange={e => updateCourse(idx, "sections", e.target.value)} />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyFormDialog;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";
const FIXED_DEPARTMENT = "Computer Engineering";

const FacultyFormDialog = ({ open, onClose, onSave, initialData, availableSections = [] }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [courses, setCourses] = useState([]);

  // Backend courses list
  const [backendCourses, setBackendCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Fetch courses from backend
  useEffect(() => {
    if (!open) return;
    setLoadingCourses(true);
    axios
      .get(`${API_BASE_URL}/courses/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setBackendCourses(data);
      })
      .catch((err) => console.error("Error fetching courses:", err))
      .finally(() => setLoadingCourses(false));
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setCourses(initialData.courses.map(c => ({ ...c, sections: [...c.sections] })));
    } else {
      setName(""); setEmail(""); setCourses([]);
    }
  }, [initialData, open]);

  const addCourse = () => setCourses([...courses, { code: "", name: "", sections: [] }]);

  const removeCourse = (idx) => setCourses(courses.filter((_, i) => i !== idx));

  const handleCourseSelect = (idx, courseId) => {
    const updated = [...courses];
    const course = backendCourses.find((c) => String(c.id) === courseId);
    if (course) {
      updated[idx].code = course.code;
      updated[idx].name = course.name;
    } else {
      updated[idx].code = "";
      updated[idx].name = "";
    }
    // Reset sections when course changes
    updated[idx].sections = [];
    setCourses(updated);
  };

  const handleSectionToggle = (courseIdx, sectionName) => {
    const updated = [...courses];
    const sections = updated[courseIdx].sections;
    if (sections.includes(sectionName)) {
      updated[courseIdx].sections = sections.filter(s => s !== sectionName);
    } else {
      updated[courseIdx].sections = [...sections, sectionName];
    }
    setCourses(updated);
  };

  // Get sections available for a given course code
  const getSectionsForCourse = (courseCode) => {
    if (!courseCode) return [];
    return availableSections.filter(s => s.courseCode === courseCode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, department: FIXED_DEPARTMENT, email, courses });
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
              <Input id="dept" value={FIXED_DEPARTMENT} readOnly className="bg-muted" />
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
            {courses.map((course, idx) => {
              // Find matching backend course id for the select
              const matchedCourse = backendCourses.find(
                (c) => c.code === course.code && c.name === course.name
              );
              const matchedId = matchedCourse ? String(matchedCourse.id) : "";

              // Available sections for this course
              const courseSections = getSectionsForCourse(course.code);

              return (
                <div key={idx} className="border rounded-md p-3 space-y-3 bg-muted/20 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeCourse(idx)}>
                    <X className="w-3 h-3" />
                  </Button>

                  {/* Course Select */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Select a Course</Label>
                    <select
                      value={matchedId}
                      onChange={(e) => handleCourseSelect(idx, e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">
                        {loadingCourses ? "Loading..." : "-- Select a course --"}
                      </option>
                      {backendCourses.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Read-only code & name */}
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Course Code" value={course.code} readOnly className="bg-muted text-xs" />
                    <Input placeholder="Course Name" value={course.name} readOnly className="bg-muted text-xs" />
                  </div>

                  {/* Sections - multi-select from available sections */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assign Sections</Label>
                    {courseSections.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-1">
                        {course.code
                          ? "No sections available for this course. Add sections in the Sections tab first."
                          : "Select a course first."}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background">
                        {courseSections.map((sec) => {
                          const isSelected = course.sections.includes(sec.name);
                          return (
                            <button
                              key={sec.id}
                              type="button"
                              onClick={() => handleSectionToggle(idx, sec.name)}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                isSelected
                                  ? "bg-[#FFC20E] text-[#231F20]"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {sec.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

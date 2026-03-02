import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const SectionFormDialog = ({ open, onClose, onSave, initialData }) => {
  const [name, setName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [room, setRoom] = useState("");
  const [schoolYear, setSchoolYear] = useState("");

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
      setCourseCode(initialData.courseCode);
      setCourseName(initialData.courseName);
      setSchedule(initialData.schedule);
      setRoom(initialData.room);
      setSchoolYear(initialData.schoolYear || "");
      // Try to match to a backend course
      const match = backendCourses.find(
        (c) => c.code === initialData.courseCode && c.name === initialData.courseName
      );
      setSelectedCourseId(match ? String(match.id) : "");
    } else {
      setName("");
      setCourseCode("");
      setCourseName("");
      setSchedule("");
      setRoom("");
      setSchoolYear("");
      setSelectedCourseId("");
    }
  }, [initialData, open, backendCourses]);

  const handleCourseSelect = (e) => {
    const id = e.target.value;
    setSelectedCourseId(id);
    const course = backendCourses.find((c) => String(c.id) === id);
    if (course) {
      setCourseCode(course.code);
      setCourseName(course.name);
    } else {
      setCourseCode("");
      setCourseName("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, courseCode, courseName, schedule, room, schoolYear });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Section" : "Add Section"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Section Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BSIT 3-1" required />
          </div>

          {/* Course selection from backend */}
          <div className="space-y-2">
            <Label htmlFor="courseSelect">Select Course</Label>
            <select
              id="courseSelect"
              value={selectedCourseId}
              onChange={handleCourseSelect}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">
                {loadingCourses ? "Loading courses..." : "-- Select a course --"}
              </option>
              {backendCourses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Course Code</Label>
              <Input value={courseCode} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Course Name</Label>
              <Input value={courseName} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input id="schedule" value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. MWF 8:00-9:30" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input id="room" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 401" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">School Year</Label>
            <select
              id="schoolYear"
              value={schoolYear}
              onChange={e => setSchoolYear(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Select School Year --</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
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

export default SectionFormDialog;

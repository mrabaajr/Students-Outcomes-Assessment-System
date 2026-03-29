import { useState, useEffect } from "react";
import axios from "axios";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const API_BASE_URL = "http://localhost:8000/api";


const SectionFormDialog = ({ open, onClose, onSave, initialData, facultyOptions = [] }) => {
  const [name, setName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [schoolYears, setSchoolYears] = useState([]);
  const [facultyEmail, setFacultyEmail] = useState("");

  const [backendCourses, setBackendCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

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
    if (!open) return;
    axios
      .get(`${API_BASE_URL}/school-years/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setSchoolYears(data.map((item) => item.year).filter(Boolean));
      })
      .catch((err) => {
        console.error("Error fetching school years:", err);
        setSchoolYears(["2023-2024", "2024-2025", "2025-2026", "2026-2027"]);
      });
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setCourseCode(initialData.courseCode || "");
      setCourseName(initialData.courseName || "");
      setSchoolYear(initialData.schoolYear || "");
      setFacultyEmail(initialData.facultyEmail || "");

      const match = backendCourses.find(
        (course) => course.code === initialData.courseCode && course.name === initialData.courseName
      );
      setSelectedCourseId(match ? String(match.id) : "");
    } else {
      setName("");
      setCourseCode("");
      setCourseName("");
      setSchoolYear("");
      setFacultyEmail("");
      setSelectedCourseId("");
    }
  }, [initialData, open, backendCourses]);

  const handleCourseSelect = (event) => {
    const id = event.target.value;
    setSelectedCourseId(id);
    const course = backendCourses.find((item) => String(item.id) === id);
    if (course) {
      setCourseCode(course.code);
      setCourseName(course.name);
    } else {
      setCourseCode("");
      setCourseName("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      name,
      courseCode,
      courseName,
      schoolYear,
      facultyEmail,
    });
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
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. CPE32S1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseSelect">Course</Label>
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
              {backendCourses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facultySelect">Professor</Label>
            <select
              id="facultySelect"
              value={facultyEmail}
              onChange={(event) => setFacultyEmail(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Leave unassigned --</option>
              {facultyOptions.map((faculty) => (
                <option key={faculty.id} value={faculty.email}>
                  {faculty.name} ({faculty.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">School Year</Label>
            <select
              id="schoolYear"
              value={schoolYear}
              onChange={(event) => setSchoolYear(event.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Select School Year --</option>
              {schoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
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

import { useState, useEffect } from "react";
import axios from "axios";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const API_BASE_URL = "/api";
const SEMESTER_OPTIONS = ["1st Semester", "2nd Semester", "Summer"];

const getAutofillClassName = (isAutofilled) =>
  `w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isAutofilled
      ? "border-gray-300 bg-gray-100 text-gray-500"
      : "border-input bg-background"
  }`;


const SectionFormDialog = ({ open, onClose, onSave, initialData, facultyOptions = [] }) => {
  const [name, setName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [semester, setSemester] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [schoolYears, setSchoolYears] = useState([]);
  const [facultyEmail, setFacultyEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [backendCourseMappings, setBackendCourseMappings] = useState([]);
  const [loadingCourseMappings, setLoadingCourseMappings] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingCourseMappings(true);
    axios
      .get(`${API_BASE_URL}/course-so-mappings/`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setBackendCourseMappings(data);
      })
      .catch((err) => console.error("Error fetching course mappings:", err))
      .finally(() => setLoadingCourseMappings(false));
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
      setSemester(initialData.semester || "");
      setSchoolYear(initialData.schoolYear || "");
      setFacultyEmail(initialData.facultyEmail || "");
      setIsActive(initialData.isActive ?? true);

      const match = backendCourseMappings.find(
        (course) =>
          course.code === initialData.courseCode &&
          course.name === initialData.courseName &&
          (course.semester || "") === (initialData.semester || "") &&
          (course.academic_year || "") === (initialData.schoolYear || "")
      );
      setSelectedCourseId(match ? String(match.id) : "");
    } else {
      setName("");
      setCourseCode("");
      setCourseName("");
      setSemester("");
      setSchoolYear("");
      setFacultyEmail("");
      setIsActive(true);
      setSelectedCourseId("");
    }
  }, [initialData, open, backendCourseMappings]);

  const handleCourseSelect = (event) => {
    const id = event.target.value;
    setSelectedCourseId(id);
    const course = backendCourseMappings.find((item) => String(item.id) === id);
    if (course) {
      setCourseCode(course.code);
      setCourseName(course.name);
      setSemester(course.semester || "");
      setSchoolYear(course.academic_year || "");
    } else {
      setCourseCode("");
      setCourseName("");
      if (!initialData) {
        setSemester("");
        setSchoolYear("");
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      name,
      courseCode,
      courseName,
      semester,
      schoolYear,
      facultyEmail,
      isActive,
    });
    onClose();
  };

  const isAutofilledFromCourse = Boolean(selectedCourseId);

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
                {loadingCourseMappings ? "Loading courses..." : "-- Select a course --"}
              </option>
              {backendCourseMappings.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.code} - {course.name} ({course.academic_year || "No school year"} | {course.semester || "No semester"})
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
            <Label htmlFor="semester">Semester</Label>
            <select
              id="semester"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              required
              className={getAutofillClassName(isAutofilledFromCourse)}
            >
              <option value="">-- Select Semester --</option>
              {SEMESTER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
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
              className={getAutofillClassName(isAutofilledFromCourse)}
            >
              <option value="">-- Select School Year --</option>
              {schoolYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-3">
            <div>
              <Label htmlFor="sectionActive">Active Section</Label>
              <p className="text-xs text-muted-foreground">
                Only active sections should be used for current assessments.
              </p>
            </div>
            <input
              id="sectionActive"
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4"
            />
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

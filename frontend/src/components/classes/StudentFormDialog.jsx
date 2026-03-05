import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const StudentFormDialog = ({ open, onClose, onSave, initialData }) => {
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStudentId(initialData.studentId);
      setCourse(initialData.course);
      setYearLevel(initialData.yearLevel);
    } else {
      setName(""); setStudentId(""); setCourse(""); setYearLevel("");
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, studentId, course, yearLevel });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Full Name</Label>
            <Input id="studentName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Juan Dela Cruz" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input id="studentId" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="e.g. 2021-00101" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input id="course" value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. BSIT" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearLevel">Year Level</Label>
              <Input id="yearLevel" value={yearLevel} onChange={e => setYearLevel(e.target.value)} placeholder="e.g. 3rd Year" required />
            </div>
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

export default StudentFormDialog;

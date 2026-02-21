import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SectionFormDialog = ({ open, onClose, onSave, initialData }) => {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [room, setRoom] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCourseCode(initialData.courseCode);
      setCourseName(initialData.courseName);
      setSchedule(initialData.schedule);
      setRoom(initialData.room);
    } else {
      setName(""); setCourseCode(""); setCourseName(""); setSchedule(""); setRoom("");
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, courseCode, courseName, schedule, room });
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code</Label>
              <Input id="courseCode" value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="e.g. CS301" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseName">Course Name</Label>
              <Input id="courseName" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. Data Structures" required />
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

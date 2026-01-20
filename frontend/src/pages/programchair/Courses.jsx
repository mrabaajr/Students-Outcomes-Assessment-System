import { useState } from 'react';
import { Plus, Grid, TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { initialCourses } from '@/data/mockCoursesData';

import CoursesHeader from '@/components/courses/CoursesHeader';
import CoursesSidebar from '@/components/courses/CoursesSidebar';
import CourseStats from '@/components/courses/CourseStats';
import CourseCard from '@/components/courses/CourseCard';
import AddCourseModal from '@/components/courses/AddCourseModal';
import DeleteConfirmModal from '@/components/courses/DeleteConfirmModal';
import ViewCourseModal from '@/components/courses/ViewCourseModal';
import SOMappingMatrix from '@/components/courses/SOMappingMatrix';

const Courses = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState(initialCourses);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'matrix'
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedYear, setSelectedYear] = useState('All Years');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || 
                             course.department === selectedDepartment;
    const matchesYear = selectedYear === 'All Years' || 
                       course.academicYear === selectedYear;
    return matchesSearch && matchesDepartment && matchesYear;
  });

  // Handlers
  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsAddModalOpen(true);
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (course) => {
    setSelectedCourse(course);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCourse = (courseData) => {
    if (editingCourse) {
      setCourses(prev => prev.map(c => 
        c.id === editingCourse.id ? { ...c, ...courseData } : c
      ));
      toast({
        title: "Course Updated",
        description: `${courseData.code} has been updated successfully.`,
      });
    } else {
      setCourses(prev => [...prev, courseData]);
      toast({
        title: "Course Added",
        description: `${courseData.code} has been added successfully.`,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCourse) {
      setCourses(prev => prev.filter(c => c.id !== selectedCourse.id));
      toast({
        title: "Course Deleted",
        description: `${selectedCourse.code} has been deleted.`,
        variant: "destructive",
      });
      setIsDeleteModalOpen(false);
      setSelectedCourse(null);
    }
  };

  const handleToggleMapping = (courseId, soId, shouldMap) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const newMappedSOs = shouldMap 
          ? [...course.mappedSOs, soId]
          : course.mappedSOs.filter(id => id !== soId);
        return { ...course, mappedSOs: newMappedSOs };
      }
      return course;
    }));
    toast({
      title: shouldMap ? "Mapping Added" : "Mapping Removed",
      description: `SO mapping has been ${shouldMap ? 'added' : 'removed'}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <CoursesHeader />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <CoursesSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Course Management</h2>
              <p className="text-muted-foreground">
                Manage courses and their Student Outcome mappings
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'matrix' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('matrix')}
                  className={viewMode === 'matrix' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <TableIcon className="h-4 w-4 mr-1" />
                  Matrix
                </Button>
              </div>
              
              <Button onClick={handleAddCourse} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>
          </div>

          {/* Stats */}
          <CourseStats courses={courses} />

          {/* Content */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onView={handleViewCourse}
                  onEdit={handleEditCourse}
                  onDelete={handleDeleteClick}
                />
              ))}
              {filteredCourses.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No courses found matching your criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <SOMappingMatrix 
              courses={filteredCourses} 
              onToggleMapping={handleToggleMapping}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCourse}
        editingCourse={editingCourse}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        course={selectedCourse}
      />
      <ViewCourseModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        course={selectedCourse}
      />
    </div>
  );
};

export default Courses;

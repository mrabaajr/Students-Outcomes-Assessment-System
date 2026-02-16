import { useState, useEffect } from 'react';
import { Plus, Grid, TableIcon, BookOpen, Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';
import { useCourses } from '../../hooks/useCourses';
import { useStudentOutcomes } from '../../hooks/useStudentOutcomes';
import { departments, academicYears } from '../../data/mockCoursesData';
import Navbar from '../../components/dashboard/Navbar';
import Footer from '../../components/dashboard/Footer';

import CourseStats from '../../components/courses/CourseStats';
import CourseCard from '../../components/courses/CourseCard';
import AddCourseModal from '../../components/courses/AddCourseModal';
import DeleteConfirmModal from '../../components/courses/DeleteConfirmModal';
import ViewCourseModal from '../../components/courses/ViewCourseModal';
import SOMappingMatrix from '../../components/courses/SOMappingMatrix';

const Courses = () => {
  const { toast } = useToast();
  const { 
    courses, 
    isLoading, 
    error, 
    addCourse, 
    updateCourse, 
    deleteCourse, 
    toggleSOMapping 
  } = useCourses();
  
  // Fetch student outcomes from backend
  const { outcomes: studentOutcomes, isLoading: soLoading } = useStudentOutcomes();
  
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
  const [isSaving, setIsSaving] = useState(false);

  // Filter courses locally (in addition to backend filtering)
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

  const handleSaveCourse = async (courseData) => {
    setIsSaving(true);
    let success = false;
    
    if (editingCourse) {
      const result = await updateCourse(editingCourse.id, courseData);
      if (result.success) {
        toast({
          title: "Course Updated",
          description: `${courseData.code} has been updated successfully.`,
        });
        success = true;
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } else {
      const result = await addCourse(courseData);
      if (result.success) {
        toast({
          title: "Course Added",
          description: `${courseData.code} has been added successfully.`,
        });
        success = true;
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    }
    
    setIsSaving(false);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedCourse) {
      const result = await deleteCourse(selectedCourse.id);
      if (result.success) {
        toast({
          title: "Course Deleted",
          description: `${selectedCourse.code} has been deleted.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
      setIsDeleteModalOpen(false);
      setSelectedCourse(null);
    }
  };

  const handleToggleMapping = async (courseId, soId, shouldMap) => {
    const result = await toggleSOMapping(courseId, soId, shouldMap);
    if (result.success) {
      toast({
        title: shouldMap ? "Mapping Added" : "Mapping Removed",
        description: `SO mapping has been ${shouldMap ? 'added' : 'removed'}.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading || soLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#FFC20E]" />
            <p className="text-[#6B6B6B]">Loading courses...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#231F20] border-b border-[#A5A8AB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              COURSE MANAGEMENT
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Course & SO</span>
              <br />
              <span className="text-[#FFC20E]">Mapping System</span>
            </h1>

            <p className="text-[#A5A8AB] max-w-xl mb-8">
              Manage courses and their Student Outcome mappings. Add new courses, edit existing ones, and visualize SO mappings across your curriculum.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleAddCourse}
                className="flex items-center gap-2 bg-[#FFC20E] text-[#231F20] px-6 py-3 rounded-lg font-medium hover:bg-[#FFC20E]/90 transition-colors"
              >
                <Plus size={18} />
                <span>ADD COURSE</span>
              </button>
              <div className="flex items-center bg-[#3A3A3A] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-[#FFC20E] text-[#231F20]' 
                      : 'text-[#A5A8AB] hover:text-white'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'matrix' 
                      ? 'bg-[#FFC20E] text-[#231F20]' 
                      : 'text-[#A5A8AB] hover:text-white'
                  }`}
                >
                  <TableIcon className="h-4 w-4" />
                  Matrix View
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters Section */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-[#231F20]">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">
                  Search Courses
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
                  <input
                    type="text"
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md text-[#231F20] placeholder:text-[#A5A8AB] focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-[#E5E7EB] rounded-md text-[#231F20] focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="All Departments">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year Filter */}
              <div>
                <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">
                  Academic Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-[#E5E7EB] rounded-md text-[#231F20] focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="All Years">All Years</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <CourseStats courses={courses} />

          {/* Content */}
          <div className="mt-6">
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
                  <div className="col-span-full glass-card p-12 text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-[#A5A8AB]" />
                    <h3 className="text-lg font-semibold text-[#231F20] mb-2">No Courses Found</h3>
                    <p className="text-[#6B6B6B] mb-6">
                      No courses match your current filters. Try adjusting your search criteria.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <SOMappingMatrix 
                courses={filteredCourses} 
                studentOutcomes={studentOutcomes}
                onToggleMapping={handleToggleMapping}
              />
            )}
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Modals */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCourse}
        editingCourse={editingCourse}
        studentOutcomes={studentOutcomes}
        isSaving={isSaving}
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
        studentOutcomes={studentOutcomes}
      />
    </div>
  );
};

export default Courses;

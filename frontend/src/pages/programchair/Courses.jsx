import { useState } from 'react';
import { Plus, Grid, TableIcon, Filter, Search, GraduationCap } from 'lucide-react';
import Navbar from '../../components/dashboard/Navbar';
import Footer from '../../components/dashboard/Footer';
import CourseStats from '../../components/courses/CourseStats';
import CourseCard from '../../components/courses/CourseCard';
import AddCourseModal from '../../components/courses/AddCourseModal';
import AddCurriculumModal from '../../components/courses/AddCurriculumModal';
import DeleteConfirmModal from '../../components/courses/DeleteConfirmModal';
import ViewCourseModal from '../../components/courses/ViewCourseModal';
import SOMappingMatrix from '../../components/courses/SOMappingMatrix';
import { useToast } from '../../hooks/use-toast';
import { useCourses } from '../../hooks/useCourses';
import { useStudentOutcomes } from '../../hooks/useStudentOutcomes';
import { academicYears, semesters } from '../../data/mockCoursesData';

const Courses = () => {
  const { toast } = useToast();

  const {
    courses,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleSOMapping,
  } = useCourses();

  const { outcomes: studentOutcomes } = useStudentOutcomes();

  const [viewMode, setViewMode] = useState('grid');

  /* Filters */
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedCurriculum, setSelectedCurriculum] = useState('All Curriculums');

  /* Temporary curriculum list */
  const [curriculums, setCurriculums] = useState(['All Curriculums', '2018', '2023', '2025']);

  /* Modals */
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCurriculumModalOpen, setIsAddCurriculumModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCurriculum, setIsSavingCurriculum] = useState(false);

  /* Filtering Logic */
  const filteredCourses = courses.filter(course => {

    const matchesSearch =
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear =
      selectedYear === 'All Years' ||
      (course.academic_year || course.academicYear) === selectedYear;

    const matchesSemester =
      selectedSemester === 'All Semesters' || course.semester === selectedSemester;

    const matchesCurriculum =
      selectedCurriculum === 'All Curriculums' ||
      course.curriculum === selectedCurriculum;

    return matchesSearch && matchesYear && matchesSemester && matchesCurriculum;

  });

  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsAddModalOpen(true);
  };

  const handleAddCurriculum = () => {
    setIsAddCurriculumModalOpen(true);
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
    let result;

    if (editingCourse) {
      result = await updateCourse(editingCourse.id, courseData);
      if (result.success) {
        toast({
          title: 'Course Updated',
          description: `${courseData.code} updated successfully.`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } else {
      result = await addCourse(courseData);
      if (result.success) {
        toast({
          title: 'Course Added',
          description: `${courseData.code} added successfully.`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    }

    setIsSaving(false);

    if (result.success) setIsAddModalOpen(false);
  };

  const handleDeleteConfirm = async () => {

    if (!selectedCourse) return;

    const result = await deleteCourse(selectedCourse.id);

    if (result.success) {
      toast({
        title: 'Course Deleted',
        description: `${selectedCourse.code} deleted.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsDeleteModalOpen(false);
    setSelectedCourse(null);
  };

  const handleSaveCurriculum = async (curriculumData) => {
    setIsSavingCurriculum(true);

    const newCurriculum = curriculumData.name;
    setCurriculums(prev => {
      const nextValues = [...prev, newCurriculum];
      const uniqueValues = [...new Set(nextValues)];

      return [
        'All Curriculums',
        ...uniqueValues.filter(curriculum => curriculum !== 'All Curriculums').sort(),
      ];
    });

    setSelectedCurriculum(newCurriculum);
    setIsAddCurriculumModalOpen(false);
    setIsSavingCurriculum(false);

    toast({
      title: 'Curriculum Added',
      description: `${newCurriculum} is now available in filters and course creation.`,
    });
  };

  const handleToggleMapping = async (courseId, soId, shouldMap) => {

    const result = await toggleSOMapping(courseId, soId, shouldMap);

    if (result.success) {
      toast({
        title: shouldMap ? 'Mapping Added' : 'Mapping Removed',
        description: `SO mapping ${shouldMap ? 'added' : 'removed'}.`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <Navbar />

      <main className="flex-1">

        {/* HERO SECTION */}
        <section className="relative isolate bg-[#231F20] border-b border-[#A5A8AB] pt-16">

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

            <div className="inline-block px-3 py-1 bg-[#3A3A3A] rounded-full text-xs text-[#A5A8AB] mb-4">
              COURSE MANAGEMENT
            </div>

            <h1 className="text-4xl font-bold mb-4 text-white">
              Course & SO <span className="text-[#FFC20E]">Mapping System</span>
            </h1>

            <p className="text-[#A5A8AB] max-w-xl mb-8">
              Manage courses and Student Outcome mappings.
            </p>

            <div className="relative z-10 flex flex-wrap gap-4">

              {/* ADD COURSE */}
              <button
                type="button"
                onClick={handleAddCourse}
                className="relative z-10 flex cursor-pointer items-center gap-2 px-6 py-3 bg-[#FFC20E] text-[#231F20] rounded-lg font-medium hover:bg-[#FFC20E]/90"
              >
                <Plus className="w-5 h-5" /> ADD COURSE
              </button>

              {/* ADD CURRICULUM */}
              <button
                type="button"
                onClick={handleAddCurriculum}
                className="relative z-10 flex cursor-pointer items-center gap-2 px-6 py-3 bg-white text-[#231F20] rounded-lg font-medium hover:bg-gray-100"
              >
                <GraduationCap className="w-5 h-5" /> ADD CURRICULUM
              </button>

              {/* VIEW TOGGLE */}
              <div className="flex items-center bg-[#3A3A3A] rounded-lg p-1">

                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
                    viewMode === 'grid'
                      ? 'bg-[#FFC20E] text-[#231F20]'
                      : 'text-[#A5A8AB]'
                  }`}
                >
                  <Grid className="h-4 w-4" /> Grid
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('matrix')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
                    viewMode === 'matrix'
                      ? 'bg-[#FFC20E] text-[#231F20]'
                      : 'text-[#A5A8AB]'
                  }`}
                >
                  <TableIcon className="h-4 w-4" /> Matrix
                </button>

              </div>

            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* FILTERS */}
          <div className="glass-card p-6 mb-6">

            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-[#231F20]">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* SEARCH */}
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
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded-md"
                  />

                </div>
              </div>

              {/* CURRICULUM FILTER */}
              <div>
                <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">
                  Curriculum
                </label>

                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-[#E5E7EB] rounded-md"
                >
                  {curriculums.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>

              </div>

              {/* ACADEMIC YEAR FILTER */}
              <div>
                <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">
                  Academic Year
                </label>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-[#E5E7EB] rounded-md"
                >
                  <option value="All Years">All Years</option>
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>

              </div>

              {/* SEMESTER FILTER */}
              <div>
                <label className="text-xs font-medium text-[#6B6B6B] mb-2 block">
                  Semester
                </label>

                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-[#E5E7EB] rounded-md"
                >
                  <option value="All Semesters">All Semesters</option>
                  {semesters.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>

              </div>

            </div>
          </div>

          <CourseStats courses={courses} />

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

      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCourse}
        editingCourse={editingCourse}
        studentOutcomes={studentOutcomes}
        isSaving={isSaving}
        curriculumOptions={curriculums.filter(curriculum => curriculum !== 'All Curriculums')}
      />

      <AddCurriculumModal
        isOpen={isAddCurriculumModalOpen}
        onClose={() => setIsAddCurriculumModalOpen(false)}
        onSave={handleSaveCurriculum}
        isSaving={isSavingCurriculum}
        existingCurriculums={curriculums.filter(curriculum => curriculum !== 'All Curriculums')}
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

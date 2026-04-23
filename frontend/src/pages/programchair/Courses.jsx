import { useState, useEffect } from 'react';
import { Plus, Grid, TableIcon, Filter, Search, GraduationCap, RotateCcw, Download, ChevronDown, FileText, Table2 } from 'lucide-react';
import axios from 'axios';
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
import { semesters } from '../../data/mockCoursesData';
import { API_BASE_URL, unwrapListResponse } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const sortYearValues = (values = []) =>
  [...values].sort((a, b) => Number(a) - Number(b));

const Courses = () => {
  const { toast } = useToast();

  const {
    courses,
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleSOMapping,
  } = useCourses();

  const { outcomes: studentOutcomes } = useStudentOutcomes();

  const [viewMode, setViewMode] = useState('grid');

  /* Filters */
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedCurriculum, setSelectedCurriculum] = useState('All Curriculums');

  /* Curriculum list from backend */
  const [curriculums, setCurriculums] = useState(['All Curriculums']);
  const [currriculumsLoading, setCurriculumsLoading] = useState(true);
  const [courseMappings, setCourseMappings] = useState([]);

  /* Fetch curriculums from backend */
  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/curricula/`);
        const curriculumList = unwrapListResponse(response.data);
        if (Array.isArray(curriculumList)) {
          const curriculumNames = sortYearValues(
            curriculumList.map(c => c.year || c.name || c.id).filter(Boolean)
          );
          setCurriculums(['All Curriculums', ...curriculumNames]);
        }
      } catch (err) {
        console.error('Error fetching curriculums:', err);
        // Fallback to default curriculums if fetch fails
        setCurriculums(['All Curriculums', '2018', '2023', '2025']);
      } finally {
        setCurriculumsLoading(false);
      }
    };
    
    fetchCurriculums();
  }, []);

  useEffect(() => {
    const fetchCourseMappings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/course-so-mappings/`);
        setCourseMappings(unwrapListResponse(response.data));
      } catch (err) {
        console.error('Error fetching course mappings:', err);
        setCourseMappings([]);
      }
    };

    fetchCourseMappings();
  }, []);

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

    const matchesSemester =
      selectedSemester === 'All Semesters' || course.semester === selectedSemester;

    const matchesCurriculum =
      selectedCurriculum === 'All Curriculums' ||
      course.curriculum === selectedCurriculum;

    return matchesSearch && matchesSemester && matchesCurriculum;

  });

  const mappingLookup = courseMappings.reduce((acc, mapping) => {
    const mappingCourseId = String(mapping.course);
    const matchesSemester = selectedSemester === 'All Semesters' || mapping.semester === selectedSemester;

    if (!matchesSemester) {
      return acc;
    }

    const mappedSOs = mapping.mappedSOs || mapping.mapped_sos || [];
    const existing = acc[mappingCourseId];

    if (!existing) {
      acc[mappingCourseId] = {
        ...mapping,
        mappedSOs,
      };
      return acc;
    }

    acc[mappingCourseId] = {
      ...existing,
      mappedSOs: [...new Set([...(existing.mappedSOs || []), ...mappedSOs])],
      id: existing.id || mapping.id,
      academic_year: existing.academic_year || mapping.academic_year,
      semester:
        selectedSemester === 'All Semesters' ? existing.semester || mapping.semester : mapping.semester,
    };

    return acc;
  }, {});

  const mappingCourses = filteredCourses.map((course) => {
    const mapping = mappingLookup[String(course.id)];

    return {
      ...course,
      academicYear: mapping?.academic_year || 'Not set',
      mappedSOs: mapping?.mappedSOs || [],
      mappingId: mapping?.id || null,
    };
  });

  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const resetCourseFilters = () => {
    setSearchTerm('');
    setSelectedCurriculum('All Curriculums');
    setSelectedSemester('All Semesters');
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

    if (result.success) {
      setIsAddModalOpen(false);
      fetchCourses();
    }
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
      fetchCourses();
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
    try {
      const response = await axios.post(`${API_BASE_URL}/curricula/`, {
        year: curriculumData.name,
      });
      const newCurriculum = response.data?.year || curriculumData.name;

      setCurriculums(prev => {
        const nextValues = [...prev, newCurriculum];
        const uniqueValues = [...new Set(nextValues)];

        return [
          'All Curriculums',
          ...sortYearValues(uniqueValues.filter(curriculum => curriculum !== 'All Curriculums')),
        ];
      });

      setSelectedCurriculum(newCurriculum);
      setIsAddCurriculumModalOpen(false);

      toast({
        title: 'Curriculum Added',
        description: `${newCurriculum} is now available in filters and course creation.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.year?.[0] || err.response?.data?.detail || 'Failed to add curriculum.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCurriculum(false);
    }
  };

  const handleToggleMapping = async (courseId, soId, shouldMap) => {

    const result = await toggleSOMapping(courseId, soId, shouldMap, {
      academic_year: activeAcademicYear,
      semester: selectedSemester === 'All Semesters' ? undefined : selectedSemester,
    });

    if (result.success) {
      if (result.courseMapping) {
        setCourseMappings(prev => {
          const next = prev.filter(mapping => mapping.id !== result.courseMapping.id);
          return [...next, result.courseMapping];
        });
      }
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

  const downloadCsv = (filename, rows) => {
    const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportCoursesCsv = () => {
    const rows = [
      ['Course Code', 'Course Name', 'Curriculum', 'Year Level', 'Semester', 'Mapped SOs'],
      ...mappingCourses.map((course) => {
        const mappedCodes = studentOutcomes
          .filter((so) => (course.mappedSOs || []).some((mappedId) => String(mappedId) === String(so.id)))
          .sort((a, b) => a.number - b.number)
          .map((so) => `SO ${so.number}`)
          .join(', ');

        return [
          course.code,
          course.name,
          course.curriculum || '',
          course.yearLevel || '',
          course.semester || '',
          mappedCodes || 'None',
        ];
      }),
    ];

    downloadCsv('courses_export.csv', rows);
    toast({
      title: 'Courses Exported',
      description: 'The course list was exported as CSV.',
    });
  };

  const exportMatrixCsv = () => {
    const rows = [
      ['Course Code', 'Course Name', ...studentOutcomes.map((so) => `SO ${so.number}`)],
      ...mappingCourses.map((course) => [
        course.code,
        course.name,
        ...studentOutcomes.map((so) =>
          (course.mappedSOs || []).some((mappedId) => String(mappedId) === String(so.id)) ? 'Mapped' : 'Not Mapped'
        ),
      ]),
    ];

    downloadCsv('course_so_mapping_matrix.csv', rows);
    toast({
      title: 'SO Mapping Exported',
      description: 'The course-to-SO mapping matrix was exported as CSV.',
    });
  };

  const openPrintWindow = (title, bodyMarkup) => {
    const exportWindow = window.open('', '_blank', 'width=1280,height=900');
    if (!exportWindow) {
      toast({
        title: 'Popup Blocked',
        description: 'Allow popups for this site to export the PDF.',
        variant: 'destructive',
      });
      return;
    }

    exportWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #231F20; }
            h1 { margin: 0 0 8px; }
            p { color: #6B6B6B; margin: 0 0 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #D1D5DB; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #F5F5F5; }
          </style>
        </head>
        <body>
          ${bodyMarkup}
        </body>
      </html>
    `);
    exportWindow.document.close();
    exportWindow.focus();
    setTimeout(() => exportWindow.print(), 300);
  };

  const exportCoursesPdf = () => {
    const rows = mappingCourses.map((course) => {
      const mappedCodes = studentOutcomes
        .filter((so) => (course.mappedSOs || []).some((mappedId) => String(mappedId) === String(so.id)))
        .sort((a, b) => a.number - b.number)
        .map((so) => `SO ${so.number}`)
        .join(', ');

      return `
        <tr>
          <td>${course.code}</td>
          <td>${course.name}</td>
          <td>${course.curriculum || ''}</td>
          <td>${course.yearLevel || ''}</td>
          <td>${course.semester || ''}</td>
          <td>${mappedCodes || 'None'}</td>
        </tr>
      `;
    }).join('');

    openPrintWindow(
      'Courses Export',
      `
        <h1>Courses Export</h1>
        <p>Course list with current mapped Student Outcomes.</p>
        <table>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Curriculum</th>
              <th>Year Level</th>
              <th>Semester</th>
              <th>Mapped SOs</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `
    );
  };

  const exportMatrixPdf = () => {
    const headers = studentOutcomes.map((so) => `<th>SO ${so.number}</th>`).join('');
    const rows = mappingCourses.map((course) => `
      <tr>
        <td>${course.code}</td>
        <td>${course.name}</td>
        ${studentOutcomes.map((so) =>
          `<td>${(course.mappedSOs || []).some((mappedId) => String(mappedId) === String(so.id)) ? 'Mapped' : 'Not Mapped'}</td>`
        ).join('')}
      </tr>
    `).join('');

    openPrintWindow(
      'Course SO Mapping Matrix',
      `
        <h1>Course-to-SO Mapping Matrix</h1>
        <p>Current course mapping relationships exported from the Courses page.</p>
        <table>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              ${headers}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `
    );
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative z-10 flex cursor-pointer items-center gap-2 px-6 py-3 bg-white text-[#231F20] rounded-lg font-medium hover:bg-gray-100"
                  >
                    <Download className="w-5 h-5" /> {viewMode === 'grid' ? 'EXPORT COURSES' : 'EXPORT MATRIX'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem onClick={viewMode === 'grid' ? exportCoursesCsv : exportMatrixCsv} className="gap-2">
                    <Table2 className="h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={viewMode === 'grid' ? exportCoursesPdf : exportMatrixPdf} className="gap-2">
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  <Grid className="h-4 w-4" /> Add Courses
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
                  <TableIcon className="h-4 w-4" /> SO Mapping
                </button>

              </div>

            </div>
          </div>
        </section>

        {/* CONTENT */}
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* FILTERS */}
          <div className="glass-card p-6 mb-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-[#231F20]">Filters</h3>
              </div>
              <button
                onClick={resetCourseFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#231F20] transition hover:bg-[#F9FAFB]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-medium text-[#6B6B6B]">
                  Search Courses
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6B6B]" />
                  <input
                    type="text"
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#6B6B6B]">
                  Curriculum
                </label>
                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  {curriculums.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#6B6B6B]">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#FFC20E]"
                >
                  <option value="All Semesters">All Semesters</option>
                  {semesters.map(semester => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-[#6B6B6B]">
              Showing <span className="font-semibold text-[#231F20]">{viewMode === 'grid' ? filteredCourses.length : mappingCourses.length}</span> of{" "}
              <span className="font-semibold text-[#231F20]">{courses.length}</span> courses
            </div>
          </div>

          <CourseStats courses={mappingCourses} studentOutcomes={studentOutcomes} />

          <div className="mt-6">

            {viewMode === 'grid' ? (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {mappingCourses.map(course => (

                  <CourseCard
                    key={course.id}
                    course={course}
                    onView={handleViewCourse}
                    onEdit={handleEditCourse}
                    onDelete={handleDeleteClick}
                    studentOutcomes={studentOutcomes}
                  />

                ))}

              </div>

            ) : (

              <SOMappingMatrix
                courses={mappingCourses}
                studentOutcomes={studentOutcomes}
                onToggleMapping={handleToggleMapping}
                onExport={(format) => (format === 'pdf' ? exportMatrixPdf() : exportMatrixCsv())}
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
      />

    </div>
  );
};

export default Courses;

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, unwrapListResponse } from '@/lib/api';

const normalizeCourse = (course) => ({
  id: course.id,
  course: course.course,
  code: course.code,
  name: course.name,
  section: course.section || '',
  department: course.department,
  description: course.description || '',
  credits: course.credits || 3,
  curriculum: course.curriculum_year || course.curriculumYear || course.curriculum,
  curriculum_year: course.curriculum_year || course.curriculumYear || course.curriculum,
  semester: course.semester,
  year_level: course.year_level || '',
  academic_year: course.academic_year || '',
  academicYear: course.academicYear || course.academic_year,
  instructor: course.instructor || '',
  studentCount: course.studentCount || course.student_count || 0,
  enrolledStudents: course.studentCount || course.student_count || 0,
  status: course.status || 'active',
  mappedSOs: course.mappedSOs || course.mapped_sos || [],
  performanceIndicators: course.performanceIndicators || [],
});

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') {
    return Object.entries(detail)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join(' | ');
  }

  if (err.response?.data && typeof err.response.data === 'object') {
    return Object.entries(err.response.data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join(' | ');
  }

  return fallback;
};

// Helper: Get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses
  const fetchCourses = useCallback(async (filters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.department && filters.department !== 'All Departments') {
        params.append('department', filters.department);
      }
      if (filters.academicYear && filters.academicYear !== 'All Years') {
        params.append('academic_year', filters.academicYear);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await axios.get(`${API_BASE_URL}/course-so-mappings/?${params.toString()}`, {
        headers: getAuthHeader(),
      });

      const transformed = unwrapListResponse(response.data).map(normalizeCourse);

      setCourses(transformed);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Add course
  const addCourse = async (courseData) => {
    setError(null);
    try {
      // Map frontend field names to backend expected fields
      const payload = {
        course: courseData.selectedCourseId ? parseInt(courseData.selectedCourseId, 10) : null,
        code: courseData.code,
        name: courseData.name,
        curriculum: courseData.curriculum,
        semester: courseData.semester,
        academic_year: courseData.academic_year,
        year_level: courseData.year_level || '',
        credits: courseData.credits || 3,
        description: courseData.description || '',
        mappedSOs: courseData.mappedSOs || [],
      };
      const response = await axios.post(
        `${API_BASE_URL}/course-so-mappings/`,
        payload,
        { headers: getAuthHeader() }
      );

      const newCourse = normalizeCourse(response.data);

      setCourses(prev => [...prev, newCourse]);
      return { success: true, course: newCourse };
    } catch (err) {
      console.error('Error adding course:', err);
      return {
        success: false,
        message: getErrorMessage(err, 'Failed to add course'),
      };
    }
  };

  // Update course
  const updateCourse = async (courseId, courseData) => {
    setError(null);
    try {
      // Map frontend field names to backend expected fields
      // IMPORTANT: PUT requests require ALL fields including course and curriculum
      const payload = {
        course: courseData.course || (courseData.selectedCourseId ? parseInt(courseData.selectedCourseId, 10) : null),
        curriculum: courseData.curriculum,
        code: courseData.code,
        name: courseData.name,
        semester: courseData.semester,
        academic_year: courseData.academic_year,
        year_level: courseData.year_level || '',
        credits: courseData.credits || 3,
        description: courseData.description || '',
        mappedSOs: courseData.mappedSOs || [],
      };
      
      console.log('Updating course:', courseId, 'Payload:', payload);
      
      const response = await axios.put(
        `${API_BASE_URL}/course-so-mappings/${courseId}/`,
        payload,
        { headers: getAuthHeader() }
      );

      const updated = normalizeCourse(response.data);

      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
      return { success: true, course: updated };
    } catch (err) {
      console.error('Error updating course:', err);
      console.error('Error response data:', err.response?.data);
      return {
        success: false,
        message: getErrorMessage(err, 'Failed to update course'),
      };
    }
  };

  // Delete course
  const deleteCourse = async (courseId) => {
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/course-so-mappings/${courseId}/`, {
        headers: getAuthHeader(),
      });

      setCourses(prev => prev.filter(c => c.id !== courseId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting course:', err);
      return {
        success: false,
        message: getErrorMessage(err, 'Failed to delete course'),
      };
    }
  };

  // Toggle SO mapping
  const toggleSOMapping = async (courseId, soId, shouldMap) => {
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/course-so-mappings/${courseId}/toggle_so/`,
        { so_id: parseInt(soId), should_map: shouldMap },
        { headers: getAuthHeader() }
      );

      const updated = normalizeCourse(response.data.courseMapping);

      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error toggling SO mapping:', err);
      return {
        success: false,
        message: getErrorMessage(err, 'Failed to toggle mapping'),
      };
    }
  };

  return {
    courses,
    isLoading,
    error,
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    toggleSOMapping,
  };
}

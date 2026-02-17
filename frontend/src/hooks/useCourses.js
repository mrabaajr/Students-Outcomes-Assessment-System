import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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

      const transformed = response.data.map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        section: course.section || '',
        department: course.department,
        description: course.description || '',
        credits: course.credits || 3,
        semester: course.semester,
        academicYear: course.academicYear || course.academic_year,
        instructor: course.instructor || '',
        studentCount: course.studentCount || course.student_count || 0,
        enrolledStudents: course.studentCount || course.student_count || 0,
        status: course.status || 'active',
        mappedSOs: course.mappedSOs || [],
        performanceIndicators: course.performanceIndicators || [],
      }));

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
      const response = await axios.post(
        `${API_BASE_URL}/course-so-mappings/`,
        {
          ...courseData,
        },
        { headers: getAuthHeader() }
      );

      const newCourse = {
        ...response.data,
        academicYear: response.data.academicYear || response.data.academic_year,
        studentCount: response.data.studentCount || response.data.student_count || 0,
        enrolledStudents: response.data.studentCount || response.data.student_count || 0,
        mappedSOs: response.data.mappedSOs || [],
        performanceIndicators: response.data.performanceIndicators || [],
      };

      setCourses(prev => [...prev, newCourse]);
      return { success: true, course: newCourse };
    } catch (err) {
      console.error('Error adding course:', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Failed to add course',
      };
    }
  };

  // Update course
  const updateCourse = async (courseId, courseData) => {
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/course-so-mappings/${courseId}/`,
        { ...courseData },
        { headers: getAuthHeader() }
      );

      const updated = {
        ...response.data,
        academicYear: response.data.academicYear || response.data.academic_year,
        studentCount: response.data.studentCount || response.data.student_count || 0,
        enrolledStudents: response.data.studentCount || response.data.student_count || 0,
        mappedSOs: response.data.mappedSOs || [],
        performanceIndicators: response.data.performanceIndicators || [],
      };

      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
      return { success: true, course: updated };
    } catch (err) {
      console.error('Error updating course:', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Failed to update course',
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
        message: err.response?.data?.detail || 'Failed to delete course',
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

      const updated = {
        ...response.data.course,
        academicYear: response.data.course.academicYear || response.data.course.academic_year,
        studentCount: response.data.course.studentCount || response.data.course.student_count || 0,
        enrolledStudents: response.data.course.studentCount || response.data.course.student_count || 0,
        mappedSOs: response.data.course.mappedSOs || [],
        performanceIndicators: response.data.course.performanceIndicators || [],
      };

      setCourses(prev => prev.map(c => c.id === courseId ? updated : c));
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error toggling SO mapping:', err);
      return {
        success: false,
        message: err.response?.data?.detail || 'Failed to toggle mapping',
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

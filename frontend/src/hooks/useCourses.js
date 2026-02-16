import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses from backend
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

      const response = await axios.get(`${API_BASE_URL}/courses/?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      
      // Transform backend data to frontend format
      const transformedData = response.data.map(course => ({
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
        performanceIndicators: [],
      }));
      
      setCourses(transformedData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Add a new course
  const addCourse = async (courseData) => {
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/courses/`,
        {
          code: courseData.code,
          name: courseData.name,
          section: courseData.section || '',
          department: courseData.department,
          description: courseData.description || '',
          credits: courseData.credits || 3,
          semester: courseData.semester,
          academicYear: courseData.academicYear,
          instructor: courseData.instructor || '',
          studentCount: courseData.studentCount || 0,
          status: courseData.status || 'active',
          mappedSOs: courseData.mappedSOs || [],
        },
        { headers: getAuthHeader() }
      );
      
      const newCourse = {
        id: response.data.id,
        code: response.data.code,
        name: response.data.name,
        section: response.data.section || '',
        department: response.data.department,
        description: response.data.description || '',
        credits: response.data.credits || 3,
        semester: response.data.semester,
        academicYear: response.data.academicYear || response.data.academic_year,
        instructor: response.data.instructor || '',
        studentCount: response.data.studentCount || response.data.student_count || 0,
        enrolledStudents: response.data.studentCount || response.data.student_count || 0,
        status: response.data.status || 'active',
        mappedSOs: response.data.mappedSOs || [],
        performanceIndicators: [],
      };
      
      setCourses(prev => [...prev, newCourse]);
      return { success: true, course: newCourse };
    } catch (err) {
      console.error('Error adding course:', err);
      setError(err.response?.data?.detail || err.message);
      return { success: false, message: err.response?.data?.detail || 'Failed to add course' };
    }
  };

  // Update an existing course
  const updateCourse = async (courseId, courseData) => {
    setError(null);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/courses/${courseId}/`,
        {
          code: courseData.code,
          name: courseData.name,
          section: courseData.section || '',
          department: courseData.department,
          description: courseData.description || '',
          credits: courseData.credits || 3,
          semester: courseData.semester,
          academicYear: courseData.academicYear,
          instructor: courseData.instructor || '',
          studentCount: courseData.studentCount || 0,
          status: courseData.status || 'active',
          mappedSOs: courseData.mappedSOs || [],
        },
        { headers: getAuthHeader() }
      );
      
      const updatedCourse = {
        id: response.data.id,
        code: response.data.code,
        name: response.data.name,
        section: response.data.section || '',
        department: response.data.department,
        description: response.data.description || '',
        credits: response.data.credits || 3,
        semester: response.data.semester,
        academicYear: response.data.academicYear || response.data.academic_year,
        instructor: response.data.instructor || '',
        studentCount: response.data.studentCount || response.data.student_count || 0,
        enrolledStudents: response.data.studentCount || response.data.student_count || 0,
        status: response.data.status || 'active',
        mappedSOs: response.data.mappedSOs || [],
        performanceIndicators: [],
      };
      
      setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
      return { success: true, course: updatedCourse };
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err.response?.data?.detail || err.message);
      return { success: false, message: err.response?.data?.detail || 'Failed to update course' };
    }
  };

  // Delete a course
  const deleteCourse = async (courseId) => {
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/courses/${courseId}/`, {
        headers: getAuthHeader(),
      });
      
      setCourses(prev => prev.filter(c => c.id !== courseId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.detail || err.message);
      return { success: false, message: err.response?.data?.detail || 'Failed to delete course' };
    }
  };

  // Toggle SO mapping for a course
  const toggleSOMapping = async (courseId, soId, shouldMap) => {
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/courses/${courseId}/toggle_so/`,
        { so_id: parseInt(soId), should_map: shouldMap },
        { headers: getAuthHeader() }
      );
      
      // Update local state
      const updatedCourse = {
        ...response.data.course,
        academicYear: response.data.course.academicYear || response.data.course.academic_year,
        studentCount: response.data.course.studentCount || response.data.course.student_count || 0,
        enrolledStudents: response.data.course.studentCount || response.data.course.student_count || 0,
      };
      
      setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Error toggling SO mapping:', err);
      setError(err.response?.data?.detail || err.message);
      return { success: false, message: err.response?.data?.detail || 'Failed to toggle mapping' };
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

// applicationActions.js
import { useSetRecoilState } from 'recoil';
import { applicationsState } from './atoms';
import axios from 'axios';

export const useApplicationActions = () => {
  const setApplicationsState = useSetRecoilState(applicationsState);

  // Fetch applications for an employer
  const fetchEmployerApplications = async () => {
    setApplicationsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/application/employer/getall`,
        {
          withCredentials: true,
        }
      );
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        applications: response.data.applications,
        error: null,
      }));
    } catch (error) {
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        error: error.response.data.message,
      }));
    }
  };

  // Fetch applications for a job seeker
  const fetchJobSeekerApplications = async () => {
    setApplicationsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/application/jobseeker/getall`,
        {
          withCredentials: true,
        }
      );
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        applications: response.data.applications,
        error: null,
      }));
    } catch (error) {
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        error: error.response.data.message,
      }));
    }
  };

  // Post a new application
  const postApplication = async (data, jobId) => {
    setApplicationsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/application/post/${jobId}`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        message: response.data.message,
        error: null,
      }));
    } catch (error) {
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        error: error.response.data.message,
      }));
    }
  };

  // Delete an application
  const deleteApplication = async (id) => {
    setApplicationsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/application/delete/${id}`,
        { withCredentials: true }
      );
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        message: response.data.message,
        error: null,
      }));
    } catch (error) {
      setApplicationsState((prev) => ({
        ...prev,
        loading: false,
        error: error.response.data.message,
      }));
    }
  };

  // Clear all application-related errors
  const clearAllApplicationErrors = () => {
    setApplicationsState((prev) => ({ ...prev, error: null }));
  };

  return {
    fetchEmployerApplications,
    fetchJobSeekerApplications,
    postApplication,
    deleteApplication,
    clearAllApplicationErrors,
  };
};

import { useSetRecoilState } from 'recoil';
import { jobsState } from './atoms';
import axios from 'axios';
import { handleError, handleSuccess } from '../utils/errorHandler';

export const useJobActions = () => {
  const setJobsState = useSetRecoilState(jobsState);

  const handleApiError = (error, defaultMessage = 'An error occurred') => {
    const message = handleError(error, defaultMessage);
    setJobsState((prev) => ({
      ...prev,
      loading: false,
      error: message,
    }));
  };

  // Fetch all jobs with enhanced filtering
  const fetchJobs = async (city = "", niche = "", searchKeyword = "", page = 1, limit = 10) => {
    setJobsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const queryParams = new URLSearchParams();
      if (searchKeyword.trim()) queryParams.append('searchKeyword', searchKeyword.trim());
      if (city) queryParams.append('city', city);
      if (niche) queryParams.append('niche', niche);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/job/getall?${queryParams.toString()}`,
        { 
          withCredentials: true,
          timeout: 10000 // 10 seconds timeout
        }
      );
      
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        jobs: response.data.jobs || [],
        totalJobs: response.data.count || 0,
        currentPage: page,
        error: null,
      }));
    } catch (error) {
      handleApiError(error, 'Failed to fetch jobs');
    }
  };

  // Fetch a single job with caching
  const fetchSingleJob = async (jobId) => {
    if (!jobId) {
      handleApiError(new Error('Job ID is required'));
      return;
    }

    setJobsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/job/get/${jobId}`,
        { 
          withCredentials: true,
          timeout: 8000
        }
      );
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        singleJob: response.data.job || null,
        error: null,
      }));
    } catch (error) {
      handleApiError(error, 'Failed to fetch job details');
    }
  };

  // Post a new job with validation
  const postJob = async (data) => {
    setJobsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Client-side validation
      const requiredFields = ['title', 'jobType', 'location', 'companyName', 'responsibilities', 'qualifications', 'salary', 'jobNiche'];
      for (const field of requiredFields) {
        if (!data[field] || data[field].toString().trim() === '') {
          throw new Error(`${field} is required`);
        }
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/job/post`,
        data,
        { 
          withCredentials: true, 
          headers: { "Content-Type": "application/json" },
          timeout: 10000
        }
      );
      
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        message: response.data.message || 'Job posted successfully',
        error: null,
      }));
      
      handleSuccess('Job posted successfully!');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to post job');
    }
  };

  // Get jobs posted by the current user
  const getMyJobs = async () => {
    setJobsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/job/getmyjobs`,
        { 
          withCredentials: true,
          timeout: 8000
        }
      );
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        myJobs: response.data.myJobs || [],
        error: null,
      }));
    } catch (error) {
      handleApiError(error, 'Failed to fetch your jobs');
    }
  };

  // Delete a job with confirmation
  const deleteJob = async (id) => {
    if (!id) {
      handleApiError(new Error('Job ID is required'));
      return;
    }

    setJobsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/job/delete/${id}`,
        { 
          withCredentials: true,
          timeout: 8000
        }
      );
      
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        message: response.data.message || 'Job deleted successfully',
        myJobs: prev.myJobs.filter(job => job._id !== id),
        error: null,
      }));
      
      handleSuccess('Job deleted successfully!');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to delete job');
    }
  };

  // Clear all job-related errors
  const clearAllJobErrors = () => {
    setJobsState((prev) => ({ ...prev, error: null, message: null }));
  };

  // Reset jobs state
  const resetJobsState = () => {
    setJobsState((prev) => ({
      ...prev,
      jobs: [],
      singleJob: {},
      myJobs: [],
      error: null,
      message: null,
      loading: false,
    }));
  };

  return {
    fetchJobs,
    fetchSingleJob,
    postJob,
    getMyJobs,
    deleteJob,
    clearAllJobErrors,
    resetJobsState,
  };
};

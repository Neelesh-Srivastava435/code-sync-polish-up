import { useSetRecoilState } from 'recoil';
import { jobsState } from './atoms';
import axios from 'axios';

export const useJobActions = () => {
  const setJobsState = useSetRecoilState(jobsState);

  const handleError = (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    setJobsState((prev) => ({
      ...prev,
      loading: false,
      error: message,
    }));
  };

  // Fetch all jobs
  const fetchJobs = async (city, niche, searchKeyword = "") => {
    // setJobsState((prev) => ({ ...prev, loading: true }));
    try {
      let link = `${import.meta.env.VITE_API_URL}/api/v1/job/getall?`;
      let queryParams = [];
      if (searchKeyword) queryParams.push(`searchKeyword=${searchKeyword}`);
      if (city) queryParams.push(`city=${city}`);
      if (niche) queryParams.push(`niche=${niche}`);

      link += queryParams.join("&");
      const response = await axios.get(link, { withCredentials: true });
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        jobs: response.data.jobs || [],
        error: null,
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // Fetch a single job
  const fetchSingleJob = async (jobId) => {
    setJobsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/job/get/${jobId}`,
        { withCredentials: true }
      );
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        singleJob: response.data.job || null,
        error: null,
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // Post a new job
  const postJob = async (data) => {
    setJobsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/job/post`,
        data,
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        message: response.data.message || 'Job posted successfully',
        error: null,
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // Get jobs posted by the current user
  const getMyJobs = async () => {
    setJobsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/job/getmyjobs`,
        { withCredentials: true }
      );
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        myJobs: response.data.myJobs || [],
        error: null,
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // Delete a job
  const deleteJob = async (id) => {
    setJobsState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/v1/job/delete/${id}`,
        { withCredentials: true }
      );
      setJobsState((prev) => ({
        ...prev,
        loading: false,
        message: response.data.message || 'Job deleted successfully',
        error: null,
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // Clear all job-related errors
  const clearAllJobErrors = () => {
    setJobsState((prev) => ({ ...prev, error: null }));
  };

  return {
    fetchJobs,
    fetchSingleJob,
    postJob,
    getMyJobs,
    deleteJob,
    clearAllJobErrors,
  };
};

// userActions.js
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userState } from './atoms';
import axios from 'axios';

export const useUserActions = () => {
  const setUserState = useSetRecoilState(userState);
  const currentUserState = useRecoilValue(userState);

  const setUserToLocalStorage = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const removeUserFromLocalStorage = () => {
    localStorage.removeItem('user');
  };

  const getUserFromLocalStorage = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  // Register a new user
  const register = async (data) => {
    setUserState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/user/register`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const userData = {
        isAuthenticated: true,
        user: response.data.user,
      };
      setUserToLocalStorage(userData);
      setUserState({
        loading: false,
        isAuthenticated: true,
        user: response.data.user,
        error: null,
        message: response.data.message,
      });
    } catch (error) {
      setUserState((prev) => ({
        ...prev,
        loading: false,
        error: error.response.data.message,
      }));
    }
  };

  // Login user
  const login = async (data) => {
    setUserState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/user/login`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      const userData = {
        isAuthenticated: true,
        user: response.data.user,
      };
      setUserToLocalStorage(userData);
      setUserState({
        loading: false,
        isAuthenticated: true,
        user: response.data.user,
        error: null,
        message: response.data.message,
      });
    } catch (error) {
      setUserState((prev) => ({
        ...prev,
        loading: false,
        error: error.response.data.message,
      }));
    }
  };

  // Get user data
  const getUser = async () => {
    const storedUser = getUserFromLocalStorage();
    
    if (storedUser && storedUser.isAuthenticated) {
      setUserState({
        loading: false,
        isAuthenticated: true,
        user: storedUser.user,
        error: null,
        message: null,
      });
      return;
    }

    setUserState((prev) => ({ ...prev, loading: true }));
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/user/getuser`,
        {
          withCredentials: true,
        }
      );
      const userData = {
        isAuthenticated: true,
        user: response.data.data,
      };
      setUserToLocalStorage(userData);
      setUserState({
        loading: false,
        isAuthenticated: true,
        user: response.data.data,
        error: null,
        message: null,
      });
    } catch (error) {
      removeUserFromLocalStorage();
      setUserState({
        loading: false,
        isAuthenticated: false,
        user: {},
        error: null,
        message: null,
      });
    }
  };

  const logout = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/user/logout`,
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state, even if the server request fails
      removeUserFromLocalStorage();
      setUserState({
        loading: false,
        isAuthenticated: false,
        user: {},
        error: null,
        message: null,
      });
      window.location.href = '/';
    }
  };

  // Clear all errors
  const clearAllUserErrors = () => {
    setUserState((prev) => ({ ...prev, error: null }));
  };

  return {
    register,
    login,
    getUser,
    logout,
    clearAllUserErrors,
  };
};
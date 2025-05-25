// updateProfileActions.js
import { useSetRecoilState } from 'recoil';
import { updateProfileState } from './atoms';
import axios from 'axios';

export const useUpdateProfileActions = () => {
  const setUpdateProfileState = useSetRecoilState(updateProfileState);

  // Update user profile
  const updateProfile = async (data) => {
    setUpdateProfileState((prev) => ({ ...prev, loading: true }));
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/user/update/profile`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUpdateProfileState({
        loading: false,
        error: null,
        isUpdated: true,
      });
    } catch (error) {
      setUpdateProfileState({
        loading: false,
        error: error.response.data.message || "Failed to update profile.",
        isUpdated: false,
      });
    }
  };

  // Update user password
  const updatePassword = async (data) => {
    setUpdateProfileState((prev) => ({ ...prev, loading: true }));
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/user/update/password`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      setUpdateProfileState({
        loading: false,
        error: null,
        isUpdated: true,
      });
    } catch (error) {
      setUpdateProfileState({
        loading: false,
        error: error.response.data.message || "Failed to update password.",
        isUpdated: false,
      });
    }
  };

  // Clear all update profile related errors and reset state
  const clearAllUpdateProfileErrors = () => {
    setUpdateProfileState({
      loading: false,
      error: null,
      isUpdated: false,
    });
  };

  return {
    updateProfile,
    updatePassword,
    clearAllUpdateProfileErrors,
  };
};
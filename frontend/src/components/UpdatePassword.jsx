import { useEffect, useState } from "react";
import { useRecoilState } from 'recoil';
import { updateProfileState } from '../store/atoms';
import { useUpdateProfileActions } from '../store/updateProfileActions';
import { useUserActions } from '../store/userActions';
import { FaRegEyeSlash, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";

const UpdatePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [updateProfileStateValue ] = useRecoilState(updateProfileState);
  const { loading, error, isUpdated } = updateProfileStateValue;
  
  const { updatePassword, clearAllUpdateProfileErrors } = useUpdateProfileActions();
  const { getUser } = useUserActions();

  const handleUpdatePassword = () => {
    const formData = new FormData();
    formData.append("oldPassword", oldPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);
    updatePassword(formData);
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearAllUpdateProfileErrors();
    }
    if (isUpdated) {
      toast.success("Password Updated");
      getUser();
      clearAllUpdateProfileErrors();
    }
  }, [loading, error, isUpdated, clearAllUpdateProfileErrors, getUser]);

  return (
    <div className="account_components update_password_component">
      <h3>Update Password</h3>
      <div>
        <label>Current Password</label>
        <input
          type={showPassword ? "text" : "password"}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        {showPassword ? (
          <FaRegEyeSlash
            className="eye_icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        ) : (
          <FaEye
            className="eye_icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        )}
      </div>
      <div>
        <label>New Password</label>
        <input
          type={showPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {showPassword ? (
          <FaRegEyeSlash
            className="eye_icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        ) : (
          <FaEye
            className="eye_icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        )}
      </div>
      <div>
        <label>Confirm Password</label>
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {showPassword ? (
          <FaRegEyeSlash
            className="eye_icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        ) : (
          <FaEye
            className="eye_icon"
            onClick={() => setShowPassword(!showPassword)}
          />
        )}
      </div>
      <div className="save_change_btn_wrapper">
        <button
          className="btn"
          onClick={handleUpdatePassword}
          disabled={loading}
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

export default UpdatePassword;
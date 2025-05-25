
import { useEffect, useState } from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";
import { Link, useNavigate } from "react-router-dom";
import { userState } from "../store/atoms";
import { useUserActions } from "../store/userActions";
import { toast } from "react-toastify";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FaRegUser, FaSignInAlt } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLock2Fill } from "react-icons/ri";

const Login = () => {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, isAuthenticated, error } = useRecoilValue(userState);
  const { login, clearAllUserErrors } = useUserActions();
  const navigateTo = useNavigate();

  const handleLogin = useRecoilCallback(() => async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("role", role);
    formData.append("email", email);
    formData.append("password", password);
    await login(formData);
  });

  useEffect(() => {
    if (error && !isAuthenticated) {
      toast.error(error);
      clearAllUserErrors();
    }
    if (isAuthenticated) {
      navigateTo("/");
    }
  }, [error, isAuthenticated, navigateTo, clearAllUserErrors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <FaSignInAlt className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login As
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Employer">Login as an Employer</option>
                  <option value="Job Seeker">Login as a Job Seeker</option>
                </select>
                <FaRegUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <Input
                label="Email Address"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={loading}
              loading={loading}
              variant="primary"
              className="w-full py-3 text-lg font-semibold"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                >
                  Register Now
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;

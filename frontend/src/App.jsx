
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUserActions } from "./store/userActions";
import { useEffect } from "react";

// Lazy load components for better performance
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PostApplication = lazy(() => import("./pages/PostApplication"));
const Register = lazy(() => import("./pages/Register"));

const App = () => {
  const { getUser } = useUserActions();

  useEffect(() => {
    getUser();
  }, []); 

  return (
    <>
      <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="large" message="Loading page..." />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/post/application/:jobId" element={<PostApplication />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <ToastContainer 
            position="top-right" 
            theme="light"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            className="mt-16 z-50"
            toastClassName="rounded-lg shadow-lg"
          />
        </div>
      </Router>
    </>
  );
};

export default App;

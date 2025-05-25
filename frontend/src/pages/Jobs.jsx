
import { useEffect, useState } from "react";
import { useRecoilValue, useRecoilCallback } from "recoil";
import { toast } from "react-toastify";
import { jobsState } from "../store/atoms";
import { useJobActions } from "../store/jobActions";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaMoneyBillWave, FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";

const Jobs = () => {
  const [city, setCity] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [niche, setNiche] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { jobs, loading, error } = useRecoilValue(jobsState);
  const { fetchJobs, clearAllJobErrors } = useJobActions();

  const handleCityChange = (city) => {
    setCity(city);
    setSelectedCity(city);
  };
  
  const handleNicheChange = (niche) => {
    setNiche(niche);
    setSelectedNiche(niche);
  };

  const fetchJobsCallback = useRecoilCallback(() => async () => {
    if (error) {
      toast.error(error);
      clearAllJobErrors();
    }
    await fetchJobs(city, niche, searchKeyword);
  }, [error, city, niche, searchKeyword]);

  useEffect(() => {
    fetchJobsCallback();
  }, [fetchJobsCallback]);

  const handleSearch = () => {
    fetchJobsCallback();
  };

  const clearFilters = () => {
    setCity("");
    setSelectedCity("");
    setNiche("");
    setSelectedNiche("");
    setSearchKeyword("");
  };

  const cities = [
    "Bengaluru", "Hyderabad", "Pune", "Chennai", "Mumbai", "Delhi",
    "Noida", "Gurgaon", "Kolkata", "Ahmedabad", "Jaipur", "Kochi",
    "Indore", "Coimbatore", "Nagpur", "Chandigarh", "Lucknow",
    "Bhubaneswar", "Mysuru", "Thiruvananthapuram"
  ];

  const nichesArray = [
    "Software Development", "Web Development", "Cybersecurity", "Data Science",
    "Artificial Intelligence", "Cloud Computing", "DevOps", "Mobile App Development",
    "Blockchain", "Database Administration", "Network Administration", "UI/UX Design",
    "Game Development", "IoT (Internet of Things)", "Big Data", "Machine Learning",
    "IT Project Management", "IT Support and Helpdesk", "Systems Administration", "IT Consulting"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading jobs..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Dream Job</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore thousands of job opportunities across different industries and locations
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Search Jobs"
                placeholder="Job title, company, keywords..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={handleSearch}
                variant="primary"
                className="flex items-center gap-2 px-6 py-3"
              >
                <FaSearch />
                Search Jobs
              </Button>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2 px-6 py-3"
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select 
                    value={city} 
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Cities</option>
                    {cities.map((city, index) => (
                      <option value={city} key={index}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Category</label>
                  <select
                    value={niche}
                    onChange={(e) => handleNicheChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {nichesArray.map((niche, index) => (
                      <option value={niche} key={index}>{niche}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button 
                onClick={clearFilters}
                variant="secondary"
                size="small"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {jobs?.length > 0 ? `${jobs.length} jobs found` : 'No jobs found'}
            {(selectedCity || selectedNiche) && (
              <span>
                {selectedCity && ` in ${selectedCity}`}
                {selectedNiche && ` for ${selectedNiche}`}
              </span>
            )}
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <Card 
                key={job._id} 
                className="bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
              >
                <div className="h-full flex flex-col">
                  {/* Job Header */}
                  <div className="mb-4">
                    {job.hiringMultipleCandidates === "Yes" && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mb-2">
                        Hiring Multiple
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-lg font-semibold text-blue-600 mb-1">
                      {job.companyName}
                    </p>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2 text-red-500" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaBriefcase className="mr-2 text-blue-500" />
                      <span>{job.jobType}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaMoneyBillWave className="mr-2 text-green-500" />
                      <span className="font-semibold">₹{job.salary?.toLocaleString()}/month</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaClock className="mr-2 text-purple-500" />
                      <span>{new Date(job.jobPostedOn).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="mt-auto">
                    <Link to={`/post/application/${job._id}`} className="block">
                      <Button 
                        variant="primary" 
                        className="w-full justify-center py-3 font-semibold"
                      >
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <FaBriefcase className="mx-auto text-6xl mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;

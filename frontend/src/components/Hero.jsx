
import React from 'react';
import Button from './ui/Button';
import { Link } from 'react-router-dom';
import { FaSearch, FaBriefcase, FaUsers, FaRocket } from 'react-icons/fa';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Find Your
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Dream Job
            </span>
            Today
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connecting Talent with Opportunities Across the Nation for Every Skill Level
          </p>
          
          {/* Description */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-12 max-w-4xl mx-auto border border-white/20">
            <p className="text-lg text-white/90 leading-relaxed">
              Explore a vast array of job listings in diverse industries. Whether
              you are a seasoned professional or just starting out, find the perfect
              role to advance your career. Our platform makes job searching easy and
              efficient, bringing you closer to your next big opportunity.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/jobs">
              <Button 
                variant="primary" 
                size="large"
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl px-8 py-4 text-lg font-semibold"
              >
                <FaSearch className="mr-2" />
                Explore Jobs
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                variant="outline" 
                size="large"
                className="border-white text-white hover:bg-white hover:text-blue-600 shadow-xl px-8 py-4 text-lg font-semibold"
              >
                <FaRocket className="mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <FaBriefcase className="text-3xl text-yellow-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">10K+</div>
                <div className="text-blue-100">Active Jobs</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <FaUsers className="text-3xl text-green-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">50K+</div>
                <div className="text-blue-100">Happy Users</div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <FaRocket className="text-3xl text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-blue-100">Companies</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

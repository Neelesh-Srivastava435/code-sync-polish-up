
// atoms.js
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({
  key: 'jobPortal',
  storage: localStorage,
});

// Atom for user state
export const userState = atom({
  key: 'userState',
  default: {
    loading: false,
    isAuthenticated: false,
    user: {},
    error: null,
    message: null,
  },
  effects_UNSTABLE: [persistAtom],
});

// Atom for jobs state
export const jobsState = atom({
  key: 'jobsState',
  default: {
    jobs: [],
    loading: false,
    error: null,
    message: null,
    singleJob: {},
    myJobs: [],
    totalJobs: 0,
    currentPage: 1,
    filters: {
      city: '',
      niche: '',
      searchKeyword: '',
    },
  },
});

// Atom for applications state
export const applicationsState = atom({
  key: 'applicationsState',
  default: {
    applications: [],
    loading: false,
    error: null,
    message: null,
    totalApplications: 0,
    currentPage: 1,
  },
});

// Atom for update profile state
export const updateProfileState = atom({
  key: 'updateProfileState',
  default: {
    loading: false,
    error: null,
    isUpdated: false,
  },
});

// Atom for UI state
export const uiState = atom({
  key: 'uiState',
  default: {
    sidebarOpen: false,
    mobileMenuOpen: false,
    theme: 'light',
    notifications: [],
  },
});

// Atom for search filters
export const searchFiltersState = atom({
  key: 'searchFiltersState',
  default: {
    location: '',
    jobType: '',
    salaryRange: { min: 0, max: 1000000 },
    experience: '',
    sortBy: 'newest',
  },
});

import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { sendToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    address,
    password,
    role,
    firstNiche,
    secondNiche,
    thirdNiche,
    coverLetter,
  } = req.body;

  if (!name || !email || !phone || !address || !password || !role) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
    return next(new ErrorHandler("Please provide your preferred job niches", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email already exists", 400));
  }

  const userData = {
    name,
    email,
    phone,
    address,
    password,
    role,
    niches: {
      firstNiche,
      secondNiche,
      thirdNiche,
    },
    coverLetter,
  };

  if (req.files && req.files.resume) {
    const { resume } = req.files;
    try {
      const cloudinaryResponse = await cloudinary.uploader.upload(
        resume.tempFilePath,
        { folder: "Job_Seeker's_Resume", resource_type: "auto" }
      );

      if (!cloudinaryResponse || cloudinaryResponse.error) {
        return next(new ErrorHandler("Failed to upload resume", 500));
      }
      userData.resume = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
    } catch (error) {
      return next(new ErrorHandler("Failed to upload resume", 500));
    }
  }

  const user = await User.create(userData);
  sendToken(user, 201, res, "User registered successfully");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { role, email, password } = req.body;

  if (!role || !email || !password) {
    return next(new ErrorHandler("Email, password, and role are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorHandler("Invalid email or password", 400));
  }

  if (user.role !== role) {
    return next(new ErrorHandler("Invalid role", 400));
  }

  sendToken(user, 200, res, "User logged in successfully");
});

// user.controller.js

export const logout = catchAsyncErrors(async (req, res, next) => {
  console.log('Cookies:', req.cookies);
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'None', // Important for cross-domain
      path: '/', // Ensure the cookie is accessible for all paths
    })
    .json({
      success: true,
      message: "User logged out successfully",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({ success: true, data: req.user });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    coverLetter: req.body.coverLetter,
    niches: {
      firstNiche: req.body.firstNiche,
      secondNiche: req.body.secondNiche,
      thirdNiche: req.body.thirdNiche,
    },
  };

  if (
    req.user.role === "Job Seeker" &&
    (!newUserData.niches.firstNiche || !newUserData.niches.secondNiche || !newUserData.niches.thirdNiche)
  ) {
    return next(new ErrorHandler("Please provide your preferred job niches", 400));
  }

  if (req.files && req.files.resume) {
    const resume = req.files.resume;
    const currResumeId = req.user.resume?.public_id;
    if (currResumeId) {
      await cloudinary.uploader.destroy(currResumeId);
    }
    try {
      const newResume = await cloudinary.uploader.upload(resume.tempFilePath, {
        folder: "Job_Seeker's_Resume",
        resource_type: "auto",
      });
      newUserData.resume = {
        public_id: newResume.public_id,
        url: newResume.secure_url,
      };
    } catch (error) {
      return next(new ErrorHandler("Failed to upload new resume", 500));
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user,
    message: "Profile updated successfully",
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid old password", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendToken(user, 200, res, "Password updated successfully");
});

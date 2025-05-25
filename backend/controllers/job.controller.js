import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { Job } from "../models/jobSchema.js";

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    jobType,
    location,
    companyName,
    introduction,
    responsibilities,
    qualifications,
    offers,
    salary,
    hiringMultipleCandidates,
    personalWebsiteTitle,
    personalWebsiteUrl,
    jobNiche,
  } = req.body;

  if (
    !title ||
    !jobType ||
    !location ||
    !companyName ||
    !introduction ||
    !responsibilities ||
    !qualifications ||
    !salary ||
    !jobNiche
  ) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  if (
    (personalWebsiteTitle && !personalWebsiteUrl) ||
    (!personalWebsiteTitle && personalWebsiteUrl)
  ) {
    return next(
      new ErrorHandler(
        "Personal provide both personal website details or leave both field blank",
        400
      )
    );
  }

  const postedBy = req.user._id;
  const job = await Job.create({
    title,
    jobType,
    location,
    companyName,
    introduction,
    responsibilities,
    qualifications,
    offers,
    salary,
    hiringMultipleCandidates,
    personalWebsite: {
      title: personalWebsiteTitle,
      url: personalWebsiteUrl,
    },
    jobNiche,
    postedBy,
  });

  res.status(201).json({
    success: true,
    message: "Job posted successfully",
    job,
  });
});

export const getAllJob = catchAsyncErrors(async (req, res, next) => {
  const { city, niche, searchKeyword } = req.query;
  const query = {};
  if (city) {
    query.location = city;
  }
  if (niche) {
    query.jobNiche = niche;
  }
  if (searchKeyword) {
    query.$or = [
      { title: { $regex: searchKeyword, $options: "i" } },
      { companyName: { $regex: searchKeyword, $options: "i" } },
      { introduction: { $regex: searchKeyword, $options: "i" } },
    ];
  }
  const jobs = await Job.find(query);
  res.status(200).json({
    success: true,
    jobs,
    count: jobs.length,
  });
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const {id} = req.params;
  const job = await Job.findByIdAndDelete(id);
  if(!job){
    return next(new ErrorHandler("Job not found", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

export const getASingleJob = catchAsyncErrors(async (req, res, next) => {
  const {id} = req.params;
  const job = await Job.findById(id);
  if(!job){
    return next(new ErrorHandler("Job not found", 404));
  }
  res.status(200).json({
    success: true,
    job,
  });
});

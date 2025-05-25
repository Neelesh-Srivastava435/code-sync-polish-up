import express from 'express';
import {isAuthenticated} from "../middlewares/auth.js"
import {isAuthorized} from "../middlewares/auth.js"
import { postJob, getAllJob, getMyJobs, deleteJob, getASingleJob } from '../controllers/job.controller.js';

const router = express.Router();

router.post("/post", isAuthenticated, isAuthorized("Employer"), postJob );
router.get("/getall", getAllJob);
router.get("/getmyjobs", isAuthenticated, isAuthorized("Employer"), getMyJobs);
router.delete("/delete/:id", isAuthenticated, isAuthorized("Employer"), deleteJob);
router.get("/get/:id", getASingleJob)

export default router;
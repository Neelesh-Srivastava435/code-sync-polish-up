import cron from "node-cron";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

export const newsLetterCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const jobs = await Job.find({ newsLettersSent: false });
    for (const job of jobs) {
      try {
        const filteredUsers = await User.find({
          $or: [
            { "niches.firstNiche": job.jobNiche },
            { "niches.secondNiche": job.jobNiche },
            { "niches.thirdNiche": job.jobNiche },
          ],
        });
        for (const user of filteredUsers) {
            const subject = `New Job Opportunity: ${job.title} at ${job.companyName}`;
            const message = `Dear ${user.name},
  
  We hope this email finds you well. We wanted to inform you about a new job opportunity that aligns with your professional interests.
  
  Job Details:
  - Position: ${job.title}
  - Company: ${job.companyName}
  - Location: ${job.location}
  - Salary: ${job.salary}
  - Niche: ${job.jobNiche}
  
  This position has just been posted and is currently accepting applications. We encourage you to review the full job description and consider applying if it matches your skills and career goals.
  
  If you're interested in this opportunity, we recommend submitting your application promptly, as positions in high-demand fields tend to fill quickly.
  
  Should you have any questions or need assistance with your application, please don't hesitate to reach out to our support team.
  
  Thank you for being a valued member of our community. We wish you the best in your career endeavors.
  
  Best regards,
  The Jobivist Team`;
  
            sendEmail({
              email: user.email,
              subject,
              message,
            });
          }
        job.newsLettersSent = true;
        await job.save();
      } catch (error) {
        console.error("Error in NODE CRON catch block");
        return next(console.error(error || "Some error in cron"));
      }
    }
  });
};

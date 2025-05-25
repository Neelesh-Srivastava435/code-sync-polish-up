import { useEffect } from "react";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { toast } from "react-toastify";
import { applicationsState } from "../store/atoms";
import { useApplicationActions } from "../store/applicationActions.js";
import Spinner from "./Spinner";
import { Link } from "react-router-dom";

const Applications = () => {
  const { applications, loading, error, message } = useRecoilValue(applicationsState);
  const { fetchEmployerApplications, deleteApplication, clearAllApplicationErrors } = useApplicationActions();
  const resetApplicationState = useResetRecoilState(applicationsState);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearAllApplicationErrors();
    }
    if (message) {
      toast.success(message);
      resetApplicationState();
    }
    fetchEmployerApplications();
  }, [error, message]);

  const handleDeleteApplication = (id) => {
    deleteApplication(id);
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : applications && applications.length <= 0 ? (
        <h1>You have no applications from job seekers.</h1>
      ) : (
        <>
          <div className="account_components">
            <h3>Applications For Your Posted Jobs</h3>
            <div className="applications_container">
              {applications.map((element) => (
                <div className="card" key={element._id}>
                    <p className="sub-sec">
                      <span>Job Title: </span> {element.jobInfo.jobTitle}
                    </p>
                    <p className="sub-sec">
                      <span>Applicant's Name: </span>
                      {element.jobSeekerInfo.name}
                    </p>
                    <p className="sub-sec">
                      <span>Applicant's Email:</span>
                      {element.jobSeekerInfo.email}
                    </p>
                    <p className="sub-sec">
                      <span>Applicant's Phone: </span>
                      {element.jobSeekerInfo.phone}
                    </p>
                    <p className="sub-sec">
                      <span>Applicant's Address: </span>
                      {element.jobSeekerInfo.address}
                    </p>
                    <p className="sub-sec">
                      <span>Applicant's CoverLetter: </span>
                      <textarea
                        value={element.jobSeekerInfo.coverLetter}
                        rows={5}
                        disabled
                      ></textarea>
                    </p>
                    <div className="btn-wrapper">
                      <button
                        className="outline_btn"
                        onClick={() => handleDeleteApplication(element._id)}
                      >
                        Delete Application
                      </button>
                      <Link
                        to={
                          element.jobSeekerInfo &&
                          element.jobSeekerInfo.resume.url
                        }
                        className="btn"
                        target="_blank"
                      >
                        View Resume
                      </Link>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Applications;
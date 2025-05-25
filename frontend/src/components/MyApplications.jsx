import { useEffect } from "react";
import { useRecoilValue, useResetRecoilState } from "recoil";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { applicationsState } from "../store/atoms.js";
import { useApplicationActions } from "../store/applicationActions.js";
import Spinner from "../components/Spinner";

const MyApplications = () => {
  // const { user, isAuthenticated } = useRecoilValue(userState);
  const { loading, error, applications, message } = useRecoilValue(applicationsState);
  const { fetchJobSeekerApplications, deleteApplication, clearAllApplicationErrors } = useApplicationActions();
  const resetApplicationState = useResetRecoilState(applicationsState);

  useEffect(() => {
    fetchJobSeekerApplications();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearAllApplicationErrors();
    }
    if (message) {
      toast.success(message);
      resetApplicationState();
      fetchJobSeekerApplications();
    }
  }, [error, message]);

  const handleDeleteApplication = (id) => {
    deleteApplication(id);
  };

  return (
    <>
      {loading ? (
        <Spinner />
      ) : applications && applications.length <= 0 ? (
        <h1 style={{ fontSize: "1.4rem", fontWeight: "600" }}>
          You have not applied for any job.
        </h1>
      ) : (
        <>
          <div className="account_components">
            <h3>My Application For Jobs</h3>
            <div className="applications_container">
              {applications.map((element) => (
                <div className="card" key={element._id}>
                    <p className="sub-sec">
                      <span>Job Title: </span> {element.jobInfo.jobTitle}
                    </p>
                    <p className="sub-sec">
                      <span>Name</span> {element.jobSeekerInfo.name}
                    </p>
                    <p className="sub-sec">
                      <span>Email</span> {element.jobSeekerInfo.email}
                    </p>
                    <p className="sub-sec">
                      <span>Phone: </span> {element.jobSeekerInfo.phone}
                    </p>
                    <p className="sub-sec">
                      <span>Address: </span> {element.jobSeekerInfo.address}
                    </p>
                    <p className="sub-sec">
                      <span>Coverletter: </span>
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

export default MyApplications;
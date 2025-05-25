import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import {
  FaSquareXTwitter,
  FaSquareInstagram,
  FaYoutube,
  FaLinkedin,
} from "react-icons/fa6";
import { userState } from "../store/atoms.js";

const Footer = () => {
  const { isAuthenticated } = useRecoilValue(userState);

  return (
    <>
      <footer>
        <div>
          <h2 className="logo-foot">JOBIVIST</h2>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li>DLF Tower 8th Rd, DLF Cyber City, DLF Phase 2, Sector 24, Gurugram, Haryana 122002
            </li>
            <li>jobivist@gmail.com</li>
            <li>+92 3106507521</li>
          </ul>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/jobs">Jobs</Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4>Follow Us</h4>
          <ul>
            <li>
              <Link to="/">
                <span>
                  <FaSquareXTwitter />
                </span>
                <span>Twitter (X)</span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <span>
                  <FaSquareInstagram />
                </span>
                <span>Instagram</span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <span>
                  <FaYoutube />
                </span>
                <span>Youtube</span>
              </Link>
            </li>
            <li>
              <Link to="/">
                <span>
                  <FaLinkedin />
                </span>
                <span>LinkedIn</span>
              </Link>
            </li>
          </ul>
        </div>
      </footer>
      <div className="copyright">
        &copy; CopyRight 2024. All Rights Reserved By Jobivist
      </div>
    </>
  );
};

export default Footer;
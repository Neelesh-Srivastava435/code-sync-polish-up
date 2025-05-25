import { useState } from "react";
import { useRecoilValue } from "recoil";
import { Link } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { userState } from "../store/atoms.js";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthenticated } = useRecoilValue(userState);

  return (
    <nav className={show ? "navbar show_navbar" : "navbar"}>
      <div>
          <h2 className="logo">JOBIVIST</h2>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to={"/"} onClick={() => setShow(false)}>
              HOME
            </Link>
          </li>
          <li>
            <Link to={"/jobs"} onClick={() => setShow(false)}>
              JOBS
            </Link>
          </li>
          {isAuthenticated ? (
            <li>
              <Link to={"/dashboard"} onClick={() => setShow(false)}>
                DASHBOARD
              </Link>
            </li>
          ) : (
            <li>
              <Link to={"/login"} onClick={() => setShow(false)}>
                LOGIN
              </Link>
            </li>
          )}
        </ul>
      </div>
      <GiHamburgerMenu className="hamburger" onClick={() => setShow(!show)} />
    </nav>
  );
};

export default Navbar;

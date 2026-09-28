import { useState } from "react";
import { Building2, House, Menu, UserRound, X } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "./Feedback";
import { getErrorMessage } from "../services/api";

export function SiteLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      setLogoutError(getErrorMessage(error));
    }
  }

  const accountPath = user?.role === "OWNER" ? "/owner" : "/dashboard";

  return (
    <>
      <header className="site-header">
        {logoutError && <div className="container pt-2"><ErrorMessage>{logoutError}</ErrorMessage></div>}
        <nav className="site-nav container" aria-label="Main navigation">
          <Link className="brand d-flex align-items-center gap-2" to="/">
            <span className="brand-mark"><House size={19} strokeWidth={2.4} /></span>
            haven<span className="brand-period">.</span>
          </Link>
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className={`site-links ${menuOpen ? "is-open" : ""}`}>
            <NavLink to="/properties" onClick={() => setMenuOpen(false)}>Explore homes</NavLink>
            {user ? (
              <>
                <NavLink to={accountPath} onClick={() => setMenuOpen(false)}>
                  {user.role === "OWNER" ? <Building2 size={16} /> : <UserRound size={16} />}
                  {user.role === "OWNER" ? "My dashboard" : "My account"}
                </NavLink>
                <button className="nav-signout" onClick={() => void handleLogout()}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>Log in</NavLink>
                <Link className="btn btn-dark rounded-pill px-4" to="/register" onClick={() => setMenuOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="container d-flex flex-wrap justify-content-between gap-2">
          <span>HAVEN · A BETTER WAY TO FIND HOME</span>
          <span>SEEK · DISCOVER · SETTLE IN</span>
        </div>
      </footer>
    </>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="container page-container">{children}</main>;
}

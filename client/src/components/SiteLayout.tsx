import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "./ConfirmDialog";
import { ErrorMessage } from "./Feedback";
import { getErrorMessage } from "../services/api";

export function SiteLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const brandDestination = user?.role === "OWNER" ? "/owner" : user ? "/dashboard" : "/";

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
      setMenuOpen(false);
      setConfirmLogout(false);
      navigate("/");
    } catch (error) {
      setLogoutError(getErrorMessage(error));
      setConfirmLogout(false);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="site-header">
        {logoutError && <div className="container pt-2"><ErrorMessage>{logoutError}</ErrorMessage></div>}
        <nav className="site-nav container" aria-label="Main navigation">
          <Link className="brand" to={brandDestination}>haven</Link>
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
            {user ? (
              <>
                <NavLink to={user.role === "OWNER" ? "/owner" : "/dashboard"} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
                <NavLink to="/properties" onClick={() => setMenuOpen(false)}>Properties</NavLink>
                {user.role === "OWNER"
                  ? <><NavLink to="/owner/properties" onClick={() => setMenuOpen(false)}>My listings</NavLink>
                    <NavLink to="/owner/inquiries" onClick={() => setMenuOpen(false)}>Inquiries</NavLink></>
                  : <NavLink to="/dashboard/inquiries" onClick={() => setMenuOpen(false)}>My inquiries</NavLink>}
                <button className="nav-signout" onClick={() => setConfirmLogout(true)}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
                <NavLink to="/properties" onClick={() => setMenuOpen(false)}>Properties</NavLink>
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>Log in</NavLink>
                <Link className="btn btn-primary" to="/register?role=owner" onClick={() => setMenuOpen(false)}>
                  List a property
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="container footer-content">
          <div className="footer-identity">
            <Link className="brand" to={brandDestination}>haven</Link>
            <span>TS Academy · Group 51</span>
          </div>
        </div>
      </footer>
      {confirmLogout && <ConfirmDialog
        title="Log out of Haven?"
        message="You’ll need to sign in again to manage your account."
        confirmLabel="Log out"
        busy={loggingOut}
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => void handleLogout()}
      />}
    </>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="container page-container">{children}</main>;
}

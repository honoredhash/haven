import { useState } from "react";
import { ArrowLeft, Building2, House } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/Feedback";
import { getErrorMessage } from "../services/api";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const { user, login, register } = useAuth();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<"SEEKER" | "OWNER">(searchParams.get("role") === "owner" ? "OWNER" : "SEEKER");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? location.state?.from ?? null;

  if (user) return <Navigate to={redirectTo ?? (user.role === "OWNER" ? "/owner" : "/dashboard")} replace />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    try {
      const currentUser = registering
        ? await register(String(data.get("name") ?? ""), email, password, role)
        : await login(email, password);
      navigate(redirectTo ?? (currentUser.role === "OWNER" ? "/owner" : "/dashboard"), { replace: true });
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to Haven</Link>
        <Link to="/" className="brand auth-brand"><span className="brand-mark"><House size={19} /></span>haven<span className="brand-period">.</span></Link>
        <span className="section-kicker">{registering ? "MAKE YOURSELF AT HOME" : "WELCOME BACK"}</span>
        <h1>{registering ? "Find your place here." : "Good to have you back."}</h1>
        <p>{registering ? "Create an account to find a home or share yours." : "Sign in to continue your property journey."}</p>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <form onSubmit={(event) => void submit(event)} className="auth-form">
          {registering && <label className="form-label">Your name
            <input name="name" className="form-control" autoComplete="name" minLength={2} maxLength={80} required />
          </label>}
          <label className="form-label">Email address
            <input name="email" className="form-control" type="email" autoComplete="email" required />
          </label>
          <label className="form-label">Password
            <input name="password" className="form-control" type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              minLength={registering ? 10 : undefined} maxLength={72} required />
            {registering && <span className="form-hint">Use at least 10 characters.</span>}
          </label>
          {registering && <fieldset className="role-select">
            <legend>I’m here to...</legend>
            <button type="button" aria-pressed={role === "SEEKER"} className={role === "SEEKER" ? "selected" : ""}
              onClick={() => setRole("SEEKER")}><House size={19} /><strong>Find a home</strong><span>Explore and ask about properties</span></button>
            <button type="button" aria-pressed={role === "OWNER"} className={role === "OWNER" ? "selected" : ""}
              onClick={() => setRole("OWNER")}><Building2 size={19} /><strong>List my property</strong><span>Share a property with seekers</span></button>
          </fieldset>}
          <button type="submit" className="btn btn-dark rounded-pill w-100 py-3" disabled={submitting}>
            {submitting ? "Please wait..." : registering ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="auth-switch">{registering ? "Already have an account?" : "New to Haven?"}
          <Link to={registering ? "/login" : "/register"}>{registering ? " Log in" : " Create an account"}</Link>
        </p>
      </section>
    </main>
  );
}

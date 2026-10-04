import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Eye, EyeOff, House } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/Feedback";
import { getErrorMessage } from "../services/api";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const { user, login, register } = useAuth();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<"SEEKER" | "OWNER" | null>(
    searchParams.get("role") === "owner" ? "OWNER" : null
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname ?? location.state?.from ?? null;

  useEffect(() => setShowPassword(false), [mode]);

  if (user && !registering) {
    return <Navigate to={redirectTo ?? (user.role === "OWNER" ? "/owner" : "/dashboard")} replace />;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role) {
      setError("Choose whether you want to find a home or list a property.");
      return;
    }
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    try {
      if (registering) {
        await register(String(data.get("name") ?? ""), email, password, role);
      } else {
        await login(email, password, role);
      }
      navigate(redirectTo ?? (role === "OWNER" ? "/owner" : "/dashboard"), { replace: true });
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
        <Link to="/" className="brand auth-brand">haven</Link>
        <span className="section-kicker">ACCOUNT</span>
        <h1>{registering ? "Create an account" : "Sign in"}</h1>
        <p>{registering
          ? "Choose the account type you want to create."
          : "Choose the account type you want to access."}</p>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <form onSubmit={(event) => void submit(event)} className="auth-form">
          {registering && <label className="form-label">Your name
            <input name="name" className="form-control" autoComplete="name" minLength={2} maxLength={80} required />
          </label>}
          <label className="form-label">Email address
            <input name="email" className="form-control" type="email" autoComplete="email" required />
          </label>
          <div className="form-label">
            <label htmlFor="auth-password">Password</label>
            <span className="password-input-wrap">
              <input id="auth-password" name="password" className="form-control" type={showPassword ? "text" : "password"}
                autoComplete={registering ? "new-password" : "current-password"}
                minLength={registering ? 10 : undefined} maxLength={72} required />
              <button className="password-visibility-toggle" type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            {registering && <span className="form-hint">Use at least 10 characters.</span>}
          </div>
          <fieldset className="role-select" aria-invalid={!role && Boolean(error)}>
            <legend>{registering ? "I want to..." : "Log in as..."}</legend>
            <button type="button" aria-pressed={role === "SEEKER"} className={role === "SEEKER" ? "selected" : ""}
              onClick={() => { setRole("SEEKER"); setError(""); }}>
              <House size={20} /><strong>Find a Home</strong>
              <span>{registering ? "Browse homes and contact property owners" : "Open your property-seeker dashboard"}</span>
            </button>
            <button type="button" aria-pressed={role === "OWNER"} className={role === "OWNER" ? "selected" : ""}
              onClick={() => { setRole("OWNER"); setError(""); }}>
              <Building2 size={20} /><strong>List a Property</strong>
              <span>{registering ? "Publish listings and manage inquiries" : "Open your property-owner dashboard"}</span>
            </button>
          </fieldset>
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

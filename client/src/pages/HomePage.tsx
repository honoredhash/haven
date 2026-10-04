import { ArrowRight, Building2, ClipboardCheck, House, MessageCircle, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    navigate(`/properties${query.size ? `?${query.toString()}` : ""}`);
  }

  return (
    <main className="home-page container">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="section-kicker">PROPERTY LISTING APP</p>
          <h1>Find a property.<br />Or list your own.</h1>
          <p className="hero-intro">
            Search available properties and contact their owners, or create a listing of your own.
          </p>
          <form className="home-search" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="home-search">Search properties by name or location</label>
            <input
              id="home-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by property or location"
            />
            <button className="btn btn-primary" type="submit">Search properties</button>
          </form>
          <p className="home-owner-link">
            Are you a property owner?{" "}
            {user?.role === "OWNER" ? (
              <Link to="/owner/properties/new">Create a listing</Link>
            ) : (
              <Link to="/register?role=owner">Create a listing</Link>
            )}
          </p>
        </div>
      </section>

      <section className="home-section home-how" aria-labelledby="home-how-title">
        <div className="home-section-heading">
          <p className="section-kicker">A SIMPLE WAY TO GET STARTED</p>
          <h2 id="home-how-title">From browsing to your next step</h2>
          <p>Everything you need to move forward, whether you’re searching or sharing a property.</p>
        </div>
        <div className="home-steps">
          <article className="home-step">
            <span className="home-step-number">01</span>
            <span className="home-step-icon"><Search size={20} aria-hidden="true" /></span>
            <h3>Explore properties</h3>
            <p>Browse listings and use search and filters to focus on what matters to you.</p>
          </article>
          <article className="home-step">
            <span className="home-step-number">02</span>
            <span className="home-step-icon"><MessageCircle size={20} aria-hidden="true" /></span>
            <h3>Start a conversation</h3>
            <p>Found a place you like? Send an inquiry to its owner from the property page.</p>
          </article>
          <article className="home-step">
            <span className="home-step-number">03</span>
            <span className="home-step-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
            <h3>Keep things organised</h3>
            <p>Return to your dashboard to keep track of your inquiries or listing activity.</p>
          </article>
        </div>
      </section>

      <section className="home-section home-audience" aria-labelledby="home-audience-title">
        <div className="home-section-heading">
          <p className="section-kicker">MADE FOR BOTH SIDES</p>
          <h2 id="home-audience-title">How will you use Haven?</h2>
        </div>
        <div className="home-audience-grid">
          <article className="home-audience-card">
            <span className="home-audience-icon"><House size={22} aria-hidden="true" /></span>
            <h3>Find a home</h3>
            <p>Discover available places, compare the details, and contact owners about the homes that interest you.</p>
            <Link to="/properties" className="home-section-link">
              Browse properties <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </article>
          <article className="home-audience-card home-audience-owner">
            <span className="home-audience-icon"><Building2 size={22} aria-hidden="true" /></span>
            <h3>List a property</h3>
            <p>Create a listing, add photos and details, and manage inquiries from your owner dashboard.</p>
            <Link to={user?.role === "OWNER" ? "/owner/properties/new" : "/register?role=owner"} className="home-section-link">
              {user?.role === "OWNER" ? "Create a listing" : "Get started as an owner"}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}

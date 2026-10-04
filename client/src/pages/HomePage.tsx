import { Search } from "lucide-react";
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
    </main>
  );
}

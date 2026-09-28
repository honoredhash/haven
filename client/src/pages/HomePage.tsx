import { ArrowRight, Building2, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    navigate(`/properties${query.size ? `?${query.toString()}` : ""}`);
  }

  return (
    <main className="landing container-fluid min-vh-100">
      <section className="hero row align-items-center g-5 py-5">
        <div className="col-lg-6 hero-copy">
          <p className="eyebrow"><span /> A better way to find home</p>
          <h1>Space for your<br /><span>next chapter.</span></h1>
          <p className="hero-intro">
            Discover thoughtful places to live, or share a space you love with the people looking for it.
          </p>
          <form className="home-search mt-4" onSubmit={submitSearch}>
            <Search size={19} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="home-search">Search by location or property</label>
            <input
              id="home-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try Ikeja, apartment, or more..."
            />
            <button className="btn btn-dark rounded-pill px-4" type="submit">Search</button>
          </form>
          <div className="hero-actions d-flex flex-wrap gap-3 mt-3">
            <Link className="btn btn-outline-dark rounded-pill px-4 py-3" to="/register?role=owner">
              <Building2 size={17} className="me-2" /> List your property
            </Link>
          </div>
          <div className="hero-note mt-5">
            <span className="note-rule" />
            <span>A good move starts with the right place.</span>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="hero-art" role="img" aria-label="A sunlit modern home surrounded by greenery">
            <div className="art-sun" />
            <div className="art-label"><span>01</span> FIND YOUR PLACE <ArrowRight size={14} /></div>
            <div className="art-house">
              <div className="house-roof" />
              <div className="house-body">
                <div className="house-window window-one" />
                <div className="house-door" />
                <div className="house-window window-two" />
              </div>
              <div className="house-shadow" />
            </div>
            <div className="art-plant plant-left"><i /><i /><i /><i /><b /></div>
            <div className="art-plant plant-right"><i /><i /><i /><i /><b /></div>
            <div className="art-caption">
              <span className="caption-dot" />
              <span>YOUR NEXT CHAPTER<br /><strong>BEGINS AT HOME</strong></span>
            </div>
          </div>
        </div>
      </section>
      <section className="home-bottom">
        <div><span className="section-kicker">A PLACE FOR EVERY PLAN</span><h2>Start with what feels right.</h2></div>
        <Link to="/properties" className="text-link">Explore all homes <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}

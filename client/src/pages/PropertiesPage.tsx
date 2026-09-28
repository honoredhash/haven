import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Property } from "../services/api";
import { PropertyCard } from "../components/PropertyCard";
import { ErrorMessage, LoadingState } from "../components/Feedback";
import { PageContainer } from "../components/SiteLayout";

interface PropertyResult {
  items: Property[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function PropertiesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [result, setResult] = useState<PropertyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { setSearch(params.get("search") ?? ""); }, [params]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<PropertyResult>(api.get("/properties", { params: Object.fromEntries(params) }))
      .then((data) => { if (active) setResult(data); })
      .catch((reason: unknown) => { if (active) setError(getErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam("search", search.trim());
  }

  return (
    <PageContainer>
      <div className="page-heading">
        <div><span className="section-kicker">FIND YOUR PLACE</span><h1>Homes worth coming home to.</h1>
          <p>Browse homes, apartments, and more from local property owners.</p></div>
      </div>
      <section className="search-panel" aria-label="Search and filter properties">
        <form className="browse-search" onSubmit={submitSearch}>
          <Search size={19} aria-hidden="true" />
          <label className="visually-hidden" htmlFor="property-search">Search homes</label>
          <input id="property-search" value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by location, property name..." />
          <button type="submit" className="btn btn-dark rounded-pill px-4">Search homes</button>
        </form>
        <div className="filter-row">
          <span className="filter-label"><SlidersHorizontal size={16} /> Refine</span>
          <label>Listing
            <select value={params.get("listingType") ?? ""} onChange={(event) => updateParam("listingType", event.target.value)}>
              <option value="">Any listing</option><option value="RENT">For rent</option><option value="SALE">For sale</option>
            </select>
          </label>
          <label>Property type
            <select value={params.get("propertyType") ?? ""} onChange={(event) => updateParam("propertyType", event.target.value)}>
              <option value="">Any type</option>
              <option value="HOUSE">House</option><option value="APARTMENT">Apartment</option>
              <option value="CONDO">Condo</option><option value="LAND">Land</option>
              <option value="COMMERCIAL">Commercial</option><option value="OTHER">Other</option>
            </select>
          </label>
          <label>Bedrooms
            <select value={params.get("bedrooms") ?? ""} onChange={(event) => updateParam("bedrooms", event.target.value)}>
              <option value="">Any</option><option value="1">1+</option><option value="2">2+</option>
              <option value="3">3+</option><option value="4">4+</option>
            </select>
          </label>
          <label>Bathrooms
            <select value={params.get("bathrooms") ?? ""} onChange={(event) => updateParam("bathrooms", event.target.value)}>
              <option value="">Any</option><option value="1">1+</option><option value="2">2+</option>
              <option value="3">3+</option><option value="4">4+</option>
            </select>
          </label>
          <label>Sort by
            <select value={params.get("sort") ?? "newest"} onChange={(event) => updateParam("sort", event.target.value)}>
              <option value="newest">Newest</option><option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <div className="filter-row price-filters">
          <label>Min price <input type="number" min="0" value={params.get("minPrice") ?? ""}
            onChange={(event) => updateParam("minPrice", event.target.value)} placeholder="No minimum" /></label>
          <label>Max price <input type="number" min="0" value={params.get("maxPrice") ?? ""}
            onChange={(event) => updateParam("maxPrice", event.target.value)} placeholder="No maximum" /></label>
          <label>Location <input value={params.get("location") ?? ""}
            onChange={(event) => updateParam("location", event.target.value)} placeholder="Any location" /></label>
        </div>
      </section>

      <section className="results-section" aria-live="polite">
        {loading && <LoadingState label="Finding homes..." />}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && !error && result && (
          <>
            <div className="results-heading">
              <div><h2>Available properties</h2><p>{result.pagination.total} homes to explore</p></div>
              <span>Page {result.pagination.page} of {Math.max(result.pagination.totalPages, 1)}</span>
            </div>
            {result.items.length ? (
              <div className="property-grid">
                {result.items.map((property) => <PropertyCard key={property.id} property={property} />)}
              </div>
            ) : (
              <div className="empty-state"><h3>No homes found just yet</h3><p>Try adjusting your search or clearing some filters.</p>
                <button className="btn btn-outline-dark rounded-pill" onClick={() => setParams({})}>Clear filters</button>
              </div>
            )}
            {result.pagination.totalPages > 1 && (
              <div className="pagination-row">
                <button className="btn btn-outline-dark rounded-pill" disabled={result.pagination.page <= 1}
                  onClick={() => updateParam("page", String(result.pagination.page - 1))}>Previous</button>
                <span>Page {result.pagination.page} of {result.pagination.totalPages}</span>
                <button className="btn btn-outline-dark rounded-pill" disabled={result.pagination.page >= result.pagination.totalPages}
                  onClick={() => updateParam("page", String(result.pagination.page + 1))}>Next</button>
              </div>
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}

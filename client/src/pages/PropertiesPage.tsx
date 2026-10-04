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

interface PropertyFilters {
  search: string;
  listingType: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  location: string;
}

function filtersFromParams(query: string): PropertyFilters {
  const params = new URLSearchParams(query);
  return {
    search: params.get("search") ?? "",
    listingType: params.get("listingType") ?? "",
    propertyType: params.get("propertyType") ?? "",
    bedrooms: params.get("bedrooms") ?? "",
    bathrooms: params.get("bathrooms") ?? "",
    sort: params.get("sort") ?? "newest",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    location: params.get("location") ?? ""
  };
}

export default function PropertiesPage() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const [filters, setFilters] = useState(() => filtersFromParams(query));
  const [result, setResult] = useState<PropertyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    setFilters(filtersFromParams(query));
  }, [query]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<PropertyResult>(api.get("/properties", { params: Object.fromEntries(params) }))
      .then((data) => { if (active) setResult(data); })
      .catch((reason: unknown) => { if (active) setError(getErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);

  function updateFilter(field: keyof PropertyFilters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
    setFilterError("");
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minPrice = filters.minPrice ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setFilterError("Minimum price must be less than or equal to maximum price.");
      return;
    }

    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !(key === "sort" && value === "newest")) next.set(key, value.trim());
    });
    setFilterError("");
    setParams(next);
  }

  function changePage(page: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(page));
    setParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams();
    setFilters(filtersFromParams(""));
    setFilterError("");
    setParams(next);
  }

  return (
    <PageContainer>
      <div className="page-heading">
        <div>
          <span className="section-kicker">PROPERTY LISTINGS</span>
          <h1>Find a property</h1>
          <p>Search listings and contact property owners directly.</p>
        </div>
      </div>
      <section className="search-panel" aria-label="Search and filter properties">
        <form onSubmit={applyFilters}>
          <div className="browse-search">
            <Search size={19} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="property-search">Search property title or description</label>
            <input id="property-search" value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Property name or keyword" />
          </div>
          <div className="filter-row">
            <span className="filter-label"><SlidersHorizontal size={16} /> Filters</span>
            <label>Listing type
              <select value={filters.listingType} onChange={(event) => updateFilter("listingType", event.target.value)}>
                <option value="">Any listing</option>
                <option value="RENT">For rent</option>
                <option value="SALE">For sale</option>
              </select>
            </label>
            <label>Property type
              <select value={filters.propertyType} onChange={(event) => updateFilter("propertyType", event.target.value)}>
                <option value="">Any type</option>
                <option value="HOUSE">House</option>
                <option value="APARTMENT">Apartment</option>
                <option value="CONDO">Condo</option>
                <option value="LAND">Land</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>Bedrooms
              <select value={filters.bedrooms} onChange={(event) => updateFilter("bedrooms", event.target.value)}>
                <option value="">Any</option>
                <option value="1">1 or more</option>
                <option value="2">2 or more</option>
                <option value="3">3 or more</option>
                <option value="4">4 or more</option>
              </select>
            </label>
            <label>Bathrooms
              <select value={filters.bathrooms} onChange={(event) => updateFilter("bathrooms", event.target.value)}>
                <option value="">Any</option>
                <option value="1">1 or more</option>
                <option value="2">2 or more</option>
                <option value="3">3 or more</option>
                <option value="4">4 or more</option>
              </select>
            </label>
            <label>Sort by
              <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
          <div className="filter-row price-filters">
            <label>Minimum price (NGN)
              <input type="number" min="0" step="1" value={filters.minPrice}
                onChange={(event) => updateFilter("minPrice", event.target.value)} />
            </label>
            <label>Maximum price (NGN)
              <input type="number" min="0" step="1" value={filters.maxPrice}
                onChange={(event) => updateFilter("maxPrice", event.target.value)} />
            </label>
            <label>Location
              <input value={filters.location}
                onChange={(event) => updateFilter("location", event.target.value)}
                placeholder="Any location" />
            </label>
            <div className="filter-actions">
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
              <button type="submit" className="btn btn-primary">Apply filters</button>
            </div>
          </div>
          {filterError && <p className="filter-error" role="alert">{filterError}</p>}
        </form>
      </section>

      <section className="results-section" aria-live="polite">
        {loading && <LoadingState label="Loading properties..." />}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && !error && result && (
          <>
            <div className="results-heading">
              <div>
                <h2>Available properties</h2>
                <p>{result.pagination.total} {result.pagination.total === 1 ? "listing" : "listings"}</p>
              </div>
            </div>
            {result.items.length ? (
              <div className="property-grid">
                {result.items.map((property) => <PropertyCard key={property.id} property={property} />)}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No properties found</h3>
                <p>Try changing your search or filters.</p>
                <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
              </div>
            )}
            {result.pagination.totalPages > 1 && (
              <nav className="pagination-row" aria-label="Property pages">
                <button className="btn btn-secondary" disabled={result.pagination.page <= 1}
                  onClick={() => changePage(result.pagination.page - 1)}>Previous</button>
                <span>Page {result.pagination.page} of {result.pagination.totalPages}</span>
                <button className="btn btn-secondary" disabled={result.pagination.page >= result.pagination.totalPages}
                  onClick={() => changePage(result.pagination.page + 1)}>Next</button>
              </nav>
            )}
          </>
        )}
      </section>
    </PageContainer>
  );
}

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Building2, CirclePlus, Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Inquiry, InquiryMessage, Property } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { InquiryConversation } from "../components/InquiryConversation";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/Feedback";
import { formatPrice, PropertyCard } from "../components/PropertyCard";
import { PageContainer } from "../components/SiteLayout";

interface ListingData { items: Property[] }
interface InquiryData { items: Inquiry[] }

function DashboardHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-heading dashboard-heading"><span className="section-kicker">{eyebrow}</span>
    <h1>{title}</h1><p>{subtitle}</p></div>;
}

export function SeekerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<InquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const loadInquiries = () => apiRequest<InquiryData>(api.get("/inquiries"))
      .then(setData).catch((reason: unknown) => setError(getErrorMessage(reason)));
    void loadInquiries().finally(() => setLoading(false));
    const refresh = () => {
      if (document.visibilityState === "visible") void loadInquiries();
    };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  function appendMessage(inquiryId: string, message: InquiryMessage, status: Inquiry["status"]) {
    setData((current) => current ? {
      ...current,
      items: current.items.map((item) => item.id === inquiryId
        ? { ...item, status, messages: [...(item.messages ?? []), message] }
        : item)
    } : current);
  }
  return (
    <PageContainer>
      <DashboardHeading eyebrow="YOUR HAVEN" title={`Hello, ${user?.name.split(" ")[0] ?? "there"}.`}
        subtitle="Keep track of the homes you’ve reached out to." />
      <section className="dashboard-summary">
        <div className="summary-card"><span className="summary-icon"><Mail /></span><span className="section-kicker">YOUR INQUIRIES</span>
          <strong>{data?.items.length ?? (loading ? "—" : 0)}</strong><span>messages sent to owners</span></div>
        <div className="summary-card summary-prompt"><span className="section-kicker">STILL LOOKING?</span>
          <h2>There’s a place for you.</h2><Link to="/properties" className="text-link">Explore homes <ArrowRight size={16} /></Link></div>
      </section>
      <section className="results-section">
        <div className="results-heading"><div><h2>Your recent inquiries</h2><p>See what you’ve asked and where things stand.</p></div></div>
        {loading && <LoadingState label="Loading your inquiries..." />}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!loading && !error && !data?.items.length && <div className="empty-state"><h3>No inquiries yet</h3>
          <p>When a home catches your eye, send the owner a note.</p><Link to="/properties" className="btn btn-dark rounded-pill">Explore homes</Link></div>}
        {!!data?.items.length && <div className="inquiry-list seeker-inquiry-list">{data.items.map((inquiry) => (
          <article className="seeker-inquiry-card" key={inquiry.id}>
            <div className="inquiry-row">
              <div className="inquiry-thumb">{inquiry.property.images?.[0] && <img src={inquiry.property.images[0].url} alt="" />}</div>
              <div className="inquiry-main"><Link to={`/properties/${inquiry.property.id}`}><strong>{inquiry.property.title}</strong></Link>
                <span>{inquiry.property.location} · {formatPrice(Number(inquiry.property.price))}</span>
                <time dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleDateString()}</time></div>
              <span className={`status-pill status-${inquiry.status.toLowerCase()}`}>{inquiry.status.toLowerCase()}</span>
            </div>
            {user && <InquiryConversation inquiry={inquiry} user={user}
              onUpdated={(message, status) => appendMessage(inquiry.id, message, status)} />}
          </article>
        ))}</div>}
      </section>
    </PageContainer>
  );
}

export function OwnerDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      apiRequest<ListingData>(api.get("/properties/my-listings")),
      apiRequest<InquiryData>(api.get("/owner/inquiries"))
    ]).then(([listingData, inquiryData]) => {
      setListings(listingData.items);
      setInquiries(inquiryData.items);
    }).catch((reason: unknown) => setError(getErrorMessage(reason))).finally(() => setLoading(false));
  }, []);
  const activeCount = listings.filter((property) => property.status === "PUBLISHED").length;
  const publishedListings = listings.filter((property) => property.status === "PUBLISHED");
  return (
    <PageContainer>
      <DashboardHeading eyebrow="OWNER SPACE" title={`Welcome, ${user?.name.split(" ")[0] ?? "back"}.`}
        subtitle="Your listings and conversations, all in one place." />
      <div className="dashboard-title-actions"><h2>Your overview</h2>
        <Link to="/owner/properties/new" className="btn btn-dark rounded-pill"><Plus size={17} /> Add a property</Link></div>
      <section className="owner-metrics">
        <div className="summary-card"><span className="section-kicker">TOTAL LISTINGS</span><strong>{loading ? "—" : listings.length}</strong></div>
        <div className="summary-card"><span className="section-kicker">ACTIVE LISTINGS</span><strong>{loading ? "—" : activeCount}</strong></div>
        <div className="summary-card"><span className="section-kicker">TOTAL INQUIRIES</span><strong>{loading ? "—" : inquiries.length}</strong></div>
        <Link className="summary-card summary-link" to="/owner/inquiries"><span className="section-kicker">UNANSWERED</span>
          <strong>{loading ? "—" : inquiries.filter((inquiry) => inquiry.status === "NEW").length}</strong><span>View inquiries <ArrowRight size={14} /></span></Link>
      </section>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <section className="results-section">
        <div className="results-heading"><div><h2>Your properties</h2><p>Keep your listings fresh and up to date.</p></div>
          <Link to="/owner/properties" className="text-link">Manage all <ArrowRight size={16} /></Link></div>
        {loading && <LoadingState label="Loading your properties..." />}
        {!loading && !error && !listings.length && <div className="empty-state"><span className="empty-icon"><Building2 /></span>
          <h3>Your first listing starts here</h3><p>Share a home with seekers looking for their next place.</p>
          <Link to="/owner/properties/new" className="btn btn-dark rounded-pill">Add your first property</Link></div>}
        {!loading && !!listings.length && !publishedListings.length && <div className="empty-state">
          <h3>Your properties aren’t public yet</h3><p>Publish a listing to make it visible to property seekers.</p>
          <Link to="/owner/properties" className="text-link">Manage your listings <ArrowRight size={16} /></Link></div>}
        {!!publishedListings.length &&
          <div className="property-grid">{publishedListings.slice(0, 3).map((property) =>
          <PropertyCard key={property.id} property={property} />)}</div>}
      </section>
      <section className="results-section recent-inquiries">
        <div className="results-heading"><div><h2>Recent inquiries</h2><p>New conversations about your properties.</p></div>
          <Link to="/owner/inquiries" className="text-link">View all <ArrowRight size={16} /></Link></div>
        {!!inquiries.length && <div className="inquiry-list">{inquiries.slice(0, 3).map((inquiry) =>
          <article className="inquiry-row" key={inquiry.id}><div className="owner-avatar">{inquiry.user?.name.charAt(0)}</div>
            <div className="inquiry-main"><strong>{inquiry.user?.name} · {inquiry.property.title}</strong>
              <a href={`mailto:${inquiry.user?.email}?subject=${encodeURIComponent(`Re: ${inquiry.property.title}`)}`}>
                Reply by email: {inquiry.user?.email}</a><span>{inquiry.message}</span>
              <time dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleDateString()}</time></div>
            <span className={`status-pill status-${inquiry.status.toLowerCase()}`}>{inquiry.status.toLowerCase()}</span></article>)}</div>}
        {!loading && !error && !inquiries.length && <p className="muted-copy">Inquiries from seekers will show up here.</p>}
      </section>
    </PageContainer>
  );
}

export function OwnerListings() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const location = useLocation();
  const [notice, setNotice] = useState<string>(location.state?.notice ?? "");
  const load = useCallback(() => {
    setLoading(true);
    apiRequest<ListingData>(api.get("/properties/my-listings"))
      .then((result) => setItems(result.items))
      .catch((reason: unknown) => setError(getErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  async function removeProperty(property: Property) {
    setDeleting(true);
    setError("");
    try {
      await apiRequest(api.delete(`/properties/${property.id}`));
      setItems((current) => current.filter((item) => item.id !== property.id));
      setNotice("Property listing deleted.");
      setPropertyToDelete(null);
    } catch (reason) {
      setError(getErrorMessage(reason));
      setPropertyToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageContainer>
      <DashboardHeading eyebrow="YOUR LISTINGS" title="Your properties."
        subtitle="Manage, update, and keep an eye on every place you’ve listed." />
      <div className="dashboard-title-actions"><span>{items.length} {items.length === 1 ? "property" : "properties"}</span>
        <Link to="/owner/properties/new" className="btn btn-dark rounded-pill"><CirclePlus size={17} /> Add a property</Link></div>
      {notice && <SuccessMessage>{notice}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <LoadingState label="Loading your listings..." />}
      {!loading && !items.length && !error && <div className="empty-state"><h3>No listings yet</h3>
        <p>Your first property is just a few details away.</p><Link to="/owner/properties/new" className="btn btn-dark rounded-pill">Add a property</Link></div>}
      <div className="owner-listing-grid">{items.map((property) => (
        <article className="owner-listing-card" key={property.id}>
          <div className="owner-listing-image">{property.images[0] && <img src={property.images[0].url} alt="" />}
            <span className={`status-pill status-${property.status.toLowerCase()}`}>{property.status.toLowerCase()}</span></div>
          <div className="owner-listing-body"><div><span className="section-kicker">{property.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}</span>
              <h3>{property.title}</h3><p>{property.location} · {formatPrice(property.price)}</p>
            </div><span className="inquiry-count"><Mail size={15} /> {property._count?.inquiries ?? 0}</span></div>
          <div className="owner-listing-actions"><Link to={`/owner/properties/${property.id}/edit`}><Pencil size={15} /> Edit listing</Link>
            {property.status === "PUBLISHED" ? <Link to={`/properties/${property.id}`}>Preview <ArrowRight size={15} /></Link>
              : <span className="muted-copy">Not public yet</span>}
            <button disabled={deleting} onClick={() => setPropertyToDelete(property)}>
              <Trash2 size={15} /> {deleting && propertyToDelete?.id === property.id ? "Deleting..." : "Delete"}
            </button></div>
        </article>
      ))}</div>
      {propertyToDelete && <ConfirmDialog
        title="Delete this listing?"
        message={`“${propertyToDelete.title}” and its inquiries will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete listing"
        busy={deleting}
        danger
        onCancel={() => setPropertyToDelete(null)}
        onConfirm={() => void removeProperty(propertyToDelete)}
      />}
    </PageContainer>
  );
}

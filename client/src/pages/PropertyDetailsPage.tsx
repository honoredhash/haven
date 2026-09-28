import { useEffect, useState } from "react";
import { ArrowLeft, Bath, BedDouble, Check, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Property } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/Feedback";
import { formatPrice } from "../components/PropertyCard";
import { PageContainer } from "../components/SiteLayout";

export default function PropertyDetailsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inquiryError, setInquiryError] = useState("");
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<{ property: Property }>(api.get(`/properties/${id}`))
      .then((data) => { if (active) setProperty(data.property); })
      .catch((reason: unknown) => { if (active) setError(getErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function sendInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: `/properties/${id}` } });
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSending(true);
    setInquiryError("");
    setMessage("");
    try {
      await apiRequest(api.post(`/properties/${id}/inquiries`, { message: form.get("message") }));
      setMessage("Your message has been sent to the property owner.");
      formElement.reset();
    } catch (reason) {
      setInquiryError(getErrorMessage(reason));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <PageContainer><LoadingState label="Loading property..." /></PageContainer>;
  if (error || !property) {
    return <PageContainer><ErrorMessage>{error || "Property not found"}</ErrorMessage>
      <Link to="/properties" className="text-link"><ArrowLeft size={16} /> Back to homes</Link></PageContainer>;
  }

  const images = property.images ?? [];
  const currentImage = images[activeImage];

  return (
    <PageContainer>
      <Link to="/properties" className="back-link"><ArrowLeft size={16} /> Back to homes</Link>
      <div className="detail-gallery">
        {currentImage ? <img className="detail-main-image" src={currentImage.url} alt={property.title} /> :
          <div className="detail-image-placeholder"><span>HAVEN HOME</span></div>}
        <span className="listing-badge">{property.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}</span>
        {images.length > 1 && (
          <>
            <button className="gallery-control previous" aria-label="Previous image"
              onClick={() => setActiveImage((activeImage + images.length - 1) % images.length)}><ChevronLeft /></button>
            <button className="gallery-control next" aria-label="Next image"
              onClick={() => setActiveImage((activeImage + 1) % images.length)}><ChevronRight /></button>
            <span className="gallery-count">{activeImage + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="detail-thumbnails">
          {images.map((image, index) => <button key={image.id} aria-label={`Show image ${index + 1}`}
            aria-pressed={activeImage === index} onClick={() => setActiveImage(index)}>
            <img src={image.url} alt="" />
          </button>)}
        </div>
      )}
      <div className="detail-layout">
        <article className="detail-main">
          <div className="detail-title-row">
            <div><span className="section-kicker">{property.propertyType.replace("_", " ")}</span>
              <h1>{property.title}</h1><p className="property-location"><MapPin size={16} />{property.location} · {property.address}</p></div>
            <p className="detail-price">{formatPrice(property.price)}</p>
          </div>
          <div className="detail-specs">
            <span><BedDouble /> {property.bedrooms} bedrooms</span><span><Bath /> {property.bathrooms} bathrooms</span>
            <span>{property.listingType === "RENT" ? "Available to rent" : "Available for sale"}</span>
          </div>
          <section className="detail-section"><h2>About this home</h2><p>{property.description}</p></section>
          {property.features?.length > 0 && <section className="detail-section"><h2>What makes it special</h2>
            <ul className="features-list">{property.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
          </section>}
          <section className="owner-card"><div className="owner-avatar">{property.owner.name.charAt(0).toUpperCase()}</div>
            <div><span className="section-kicker">YOUR PROPERTY CONTACT</span><strong>{property.owner.name}</strong>
              <span>Property owner</span></div></section>
        </article>
        <aside className="inquiry-card">
          <span className="section-kicker">INTERESTED?</span><h2>Ask about this home.</h2>
          {message && <SuccessMessage>{message}</SuccessMessage>}
          {inquiryError && <ErrorMessage>{inquiryError}</ErrorMessage>}
          {user?.role === "SEEKER" ? (
            <form onSubmit={(event) => void sendInquiry(event)}>
              <label className="form-label" htmlFor="inquiry-message">Your message</label>
              <textarea id="inquiry-message" name="message" className="form-control" rows={5}
                minLength={10} maxLength={2000} required
                placeholder="Hi, I’m interested in this property. Could you tell me more?" />
              <button type="submit" className="btn btn-dark rounded-pill w-100 mt-3" disabled={sending}>
                {sending ? "Sending..." : "Send an inquiry"}
              </button>
            </form>
          ) : user?.role === "OWNER" ? (
            <p>Sign in as a property seeker to send an inquiry about this home.</p>
          ) : (
            <><p>Sign in or create an account to get in touch with the property owner.</p>
              <Link className="btn btn-dark rounded-pill w-100 mt-2" to="/login" state={{ from: `/properties/${id}` }}>
                Log in to inquire
              </Link></>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}

import { Bath, BedDouble, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Property } from "../services/api";
export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(price);
}

export function PropertyCard({ property }: { property: Property }) {
  const imageUrl = property.images[0]?.url;

  return (
    <article className="property-card">
      <Link className="property-card-image" to={`/properties/${property.id}`} aria-label={`View ${property.title}`}>
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="property-placeholder"><span>Photo not available</span></div>
        )}
        <span className="listing-badge">{property.listingType === "RENT" ? "FOR RENT" : "FOR SALE"}</span>
      </Link>
      <div className="property-card-body">
        <p className="property-card-price">{formatPrice(property.price)}</p>
        <h3><Link to={`/properties/${property.id}`}>{property.title}</Link></h3>
        <p className="property-location"><MapPin size={15} /> {property.location}</p>
        <div className="property-card-meta">
          <span><BedDouble size={16} /> {property.bedrooms} beds</span>
          <span><Bath size={16} /> {property.bathrooms} baths</span>
          <span>{property.propertyType.replace("_", " ").toLowerCase()}</span>
        </div>
        <Link className="property-card-action" to={`/properties/${property.id}`}>View property</Link>
      </div>
    </article>
  );
}

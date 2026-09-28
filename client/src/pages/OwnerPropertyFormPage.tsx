import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Property } from "../services/api";
import { ErrorMessage, LoadingState } from "../components/Feedback";
import { PageContainer } from "../components/SiteLayout";

const blankProperty = {
  title: "",
  description: "",
  propertyType: "HOUSE",
  listingType: "RENT",
  price: "",
  location: "",
  address: "",
  bedrooms: "2",
  bathrooms: "1",
  features: "",
  status: "PUBLISHED"
};

export default function OwnerPropertyFormPage({ editing = false }: { editing?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(blankProperty);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>(location.state?.uploadError ?? "");

  useEffect(() => {
    if (typeof location.state?.uploadError === "string") {
      setError(location.state.uploadError);
    }
  }, [location.state]);

  useEffect(() => {
    if (!editing || !id) return;
    apiRequest<{ items: Property[] }>(api.get("/properties/my-listings"))
      .then(({ items }) => {
        const property = items.find((item) => item.id === id);
        if (!property) {
          navigate("/owner/properties", { replace: true });
          return;
        }
        setForm({
          title: property.title,
          description: property.description,
          propertyType: property.propertyType,
          listingType: property.listingType,
          price: String(property.price),
          location: property.location,
          address: property.address,
          bedrooms: String(property.bedrooms),
          bathrooms: String(property.bathrooms),
          features: property.features.join(", "),
          status: property.status
        });
      })
      .catch((reason: unknown) => setError(getErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, [editing, id, navigate]);

  function update(field: keyof typeof blankProperty, value: string) {
    setForm((current) => {
      const updated = { ...current, [field]: value };
      if (field === "listingType" && value === "RENT" && current.status === "SOLD") {
        updated.status = "PUBLISHED";
      }
      if (field === "listingType" && value === "SALE" && current.status === "RENTED") {
        updated.status = "PUBLISHED";
      }
      return updated;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const data = {
      ...form,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      features: form.features.split(",").map((feature) => feature.trim()).filter(Boolean)
    };
    try {
      const result = editing
        ? await apiRequest<{ property: Property }>(api.patch(`/properties/${id}`, data))
        : await apiRequest<{ property: Property }>(api.post("/properties", data));
      const propertyId = result.property.id;
      if (files?.length) {
        const upload = new FormData();
        Array.from(files).forEach((file) => upload.append("images", file));
        try {
          await apiRequest(api.post(`/properties/${propertyId}/images`, upload, {
            headers: { "Content-Type": "multipart/form-data" }
          }));
        } catch (uploadError) {
          navigate(`/owner/properties/${propertyId}/edit`, {
            state: { uploadError: getErrorMessage(uploadError) },
            replace: true
          });
          return;
        }
      }
      navigate("/owner/properties", { state: { notice: editing ? "Your listing has been updated." : "Your property is now listed." } });
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageContainer><LoadingState label="Loading property details..." /></PageContainer>;

  return (
    <PageContainer>
      <Link to="/owner/properties" className="back-link"><ArrowLeft size={16} /> Back to your listings</Link>
      <div className="form-page-heading"><span className="section-kicker">SHARE A PLACE TO CALL HOME</span>
        <h1>{editing ? "Update your listing." : "List your property."}</h1>
        <p>Give seekers the details they need to picture their next chapter.</p></div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <form className="property-form" onSubmit={(event) => void submit(event)}>
        <section className="form-section">
          <h2>Tell us about the property</h2>
          <div className="form-grid">
            <label className="form-label span-two">Listing title
              <input className="form-control" value={form.title} onChange={(event) => update("title", event.target.value)}
                minLength={5} maxLength={120} required placeholder="e.g. Light-filled family home in Ikeja" />
            </label>
            <label className="form-label">Property type
              <select className="form-select" value={form.propertyType} onChange={(event) => update("propertyType", event.target.value)}>
                <option value="HOUSE">House</option><option value="APARTMENT">Apartment</option>
                <option value="CONDO">Condo</option><option value="LAND">Land</option>
                <option value="COMMERCIAL">Commercial</option><option value="OTHER">Other</option>
              </select>
            </label>
            <label className="form-label">Listing type
              <select className="form-select" value={form.listingType} onChange={(event) => update("listingType", event.target.value)}>
                <option value="RENT">For rent</option><option value="SALE">For sale</option>
              </select>
            </label>
            <label className="form-label">Price (NGN)
              <input type="number" className="form-control" value={form.price} onChange={(event) => update("price", event.target.value)}
                min="1" step="1" required />
            </label>
            <label className="form-label">Status
              <select className="form-select" value={form.status} onChange={(event) => update("status", event.target.value)}>
                <option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
                {form.listingType === "RENT" ? <option value="RENTED">Rented</option> : <option value="SOLD">Sold</option>}
              </select>
            </label>
            <label className="form-label">Location
              <input className="form-control" value={form.location} onChange={(event) => update("location", event.target.value)}
                maxLength={120} required placeholder="e.g. Ikeja, Lagos" />
            </label>
            <label className="form-label">Street address
              <input className="form-control" value={form.address} onChange={(event) => update("address", event.target.value)}
                maxLength={200} required placeholder="Street or neighborhood" />
            </label>
            <label className="form-label">Bedrooms
              <input type="number" className="form-control" value={form.bedrooms} onChange={(event) => update("bedrooms", event.target.value)}
                min="0" max="100" required />
            </label>
            <label className="form-label">Bathrooms
              <input type="number" className="form-control" value={form.bathrooms} onChange={(event) => update("bathrooms", event.target.value)}
                min="0" max="100" required />
            </label>
            <label className="form-label span-two">Description
              <textarea className="form-control" value={form.description}
                onChange={(event) => update("description", event.target.value)} minLength={20} maxLength={5000}
                rows={6} required placeholder="What makes this property special? Share the details that matter." />
            </label>
            <label className="form-label span-two">Features <span className="form-hint">Separate each feature with a comma.</span>
              <input className="form-control" value={form.features} onChange={(event) => update("features", event.target.value)}
                placeholder="Parking, garden, backup power..." />
            </label>
          </div>
        </section>
        <section className="form-section">
          <h2>Property photos</h2><p>Add up to 8 photos in each upload, with a maximum of 12 per listing. JPEG, PNG, WebP, or AVIF; 5 MB max per image.</p>
          <label className="upload-box">
            <ImagePlus size={23} /><strong>{files?.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "Choose property photos"}</strong>
            <span>Images are stored securely with our image provider.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple
              onChange={(event) => setFiles(event.target.files)} />
          </label>
        </section>
        <div className="form-actions"><Link to="/owner/properties" className="btn btn-outline-dark rounded-pill px-4">Cancel</Link>
          <button className="btn btn-dark rounded-pill px-4" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : editing ? "Save changes" : "Publish listing"}
          </button></div>
      </form>
    </PageContainer>
  );
}

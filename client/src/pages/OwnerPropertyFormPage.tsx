import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Property, PropertyImage } from "../services/api";
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
  const imageInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>(location.state?.uploadError ?? "");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

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
        setExistingImages(property.images);
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

  function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (selected.length > 8) {
      setError("Choose up to 8 images per upload.");
      event.target.value = "";
      return;
    }
    if (existingImages.length + selected.length > 12) {
      setError("A property can have up to 12 images. Choose fewer images.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => !allowedTypes.has(file.type))) {
      setError("Choose JPEG, PNG, WebP, or AVIF images.");
      event.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Each image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    setFiles(selected);
  }

  function clearSelectedImages() {
    setFiles([]);
    if (imageInput.current) imageInput.current.value = "";
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (existingImages.length + files.length > 12) {
      setError("A property can have up to 12 images.");
      return;
    }
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
      if (files.length) {
        const upload = new FormData();
        files.forEach((file) => upload.append("images", file));
        setUploadProgress(0);
        try {
          await apiRequest(api.post(`/properties/${propertyId}/images`, upload, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progress) => {
              if (progress.total) {
                setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
              }
            }
          }));
        } catch (uploadError) {
          setUploadProgress(null);
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
      setUploadProgress(null);
      setSubmitting(false);
    }
  }

  if (loading) return <PageContainer><LoadingState label="Loading property details..." /></PageContainer>;

  return (
    <PageContainer>
      <Link to="/owner/properties" className="back-link"><ArrowLeft size={16} /> Back to your listings</Link>
      <div className="form-page-heading"><span className="section-kicker">PROPERTY LISTING</span>
        <h1>{editing ? "Edit property" : "Create a listing"}</h1>
        <p>Add the details a property seeker needs to decide whether to get in touch.</p></div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <form className="property-form" onSubmit={(event) => void submit(event)}>
        <section className="form-section">
          <h2>Property information</h2>
          <div className="form-grid">
            <label className="form-label span-two">Listing title
              <input className="form-control" value={form.title} onChange={(event) => update("title", event.target.value)}
                minLength={5} maxLength={120} required />
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
            <label className="form-label span-two">Description
              <textarea className="form-control" value={form.description}
                onChange={(event) => update("description", event.target.value)} minLength={20} maxLength={5000}
                rows={5} required />
            </label>
          </div>
        </section>
        <section className="form-section">
          <h2>Price and location</h2>
          <div className="form-grid">
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
                maxLength={120} required />
            </label>
            <label className="form-label">Street address
              <input className="form-control" value={form.address} onChange={(event) => update("address", event.target.value)}
                maxLength={200} required placeholder="Street or neighborhood" />
            </label>
          </div>
        </section>
        <section className="form-section">
          <h2>Property details</h2>
          <div className="form-grid">
            <label className="form-label">Bedrooms
              <input type="number" className="form-control" value={form.bedrooms} onChange={(event) => update("bedrooms", event.target.value)}
                min="0" max="100" required />
            </label>
            <label className="form-label">Bathrooms
              <input type="number" className="form-control" value={form.bathrooms} onChange={(event) => update("bathrooms", event.target.value)}
                min="0" max="100" required />
            </label>
            <label className="form-label span-two">Features <span className="form-hint">Separate each feature with a comma.</span>
              <input className="form-control" value={form.features} onChange={(event) => update("features", event.target.value)}
                placeholder="Parking, garden, backup power..." />
            </label>
          </div>
        </section>
        <section className="form-section">
          <h2>Property photos</h2>
          <p>Choose up to 8 images per upload and 12 per listing. Use JPEG, PNG, WebP, or AVIF images up to 5 MB each.</p>
          {!!existingImages.length && <div className="image-preview-grid" aria-label="Current property photos">
            {existingImages.map((image, index) => <img key={image.id} src={image.url} alt={`Current property photo ${index + 1}`} />)}
          </div>}
          <label className="upload-box">
            <ImagePlus size={23} />
            <strong>{files.length ? `${files.length} image${files.length === 1 ? "" : "s"} selected` : "Choose photos"}</strong>
            <span>Images are stored with the configured image provider.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple
              ref={imageInput} disabled={existingImages.length >= 12} onChange={selectImages} />
          </label>
          {!!previews.length && <div className="image-preview-grid selected-image-previews" aria-label="Selected photos">
            {previews.map((preview, index) => <img key={preview} src={preview} alt={`Selected property photo ${index + 1}`} />)}
          </div>}
          {!!files.length && <button type="button" className="btn btn-secondary" onClick={clearSelectedImages}>
            Clear selected photos
          </button>}
          {uploadProgress !== null && <div className="upload-progress">
            <div className="progress" role="progressbar" aria-label="Image upload progress"
              aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span>Uploading images: {uploadProgress}%</span>
          </div>}
        </section>
        <div className="form-actions"><Link to="/owner/properties" className="btn btn-outline-dark rounded-pill px-4">Cancel</Link>
          <button className="btn btn-dark rounded-pill px-4" type="submit" disabled={submitting}>
            {submitting ? uploadProgress !== null ? "Uploading photos..." : "Saving..." : editing ? "Save changes" : "Publish listing"}
          </button></div>
      </form>
    </PageContainer>
  );
}

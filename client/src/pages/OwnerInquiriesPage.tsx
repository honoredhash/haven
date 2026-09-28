import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Inquiry } from "../services/api";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/Feedback";
import { PageContainer } from "../components/SiteLayout";

export default function OwnerInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    apiRequest<{ items: Inquiry[] }>(api.get("/owner/inquiries"))
      .then((data) => setItems(data.items))
      .catch((reason: unknown) => setError(getErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    setUpdating(inquiry.id);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ inquiry: Inquiry }>(api.patch(`/inquiries/${inquiry.id}`, { status }));
      setItems((current) => current.map((item) => item.id === inquiry.id ? result.inquiry : item));
      setNotice("Inquiry status updated.");
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setUpdating("");
    }
  }

  return (
    <PageContainer>
      <div className="page-heading dashboard-heading"><span className="section-kicker">OWNER SPACE</span>
        <h1>Conversations with seekers.</h1><p>Every inquiry is a chance to help someone find their next home.</p></div>
      {notice && <SuccessMessage>{notice}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <LoadingState label="Loading inquiries..." />}
      {!loading && !items.length && !error && <div className="empty-state"><h3>No inquiries yet</h3>
        <p>When a seeker reaches out about your property, you’ll see their message here.</p>
        <Link to="/owner/properties" className="text-link">View your listings <ArrowRight size={16} /></Link></div>}
      {!!items.length && <section className="inquiry-list owner-inquiry-list">{items.map((inquiry) => (
        <article className="inquiry-row" key={inquiry.id}>
          <div className="owner-avatar">{inquiry.user?.name.charAt(0).toUpperCase()}</div>
          <div className="inquiry-main"><strong>{inquiry.user?.name} asked about
            <Link to={`/properties/${inquiry.property.id}`}> {inquiry.property.title}</Link></strong>
            <span>{inquiry.user?.email} · {inquiry.property.location}</span><p>{inquiry.message}</p>
            <time dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleDateString()}</time></div>
          <div className="inquiry-status-control"><span className={`status-pill status-${inquiry.status.toLowerCase()}`}>{inquiry.status.toLowerCase()}</span>
            <label className="visually-hidden" htmlFor={`status-${inquiry.id}`}>Update inquiry status</label>
            <select id={`status-${inquiry.id}`} className="form-select form-select-sm" value={inquiry.status}
              disabled={updating === inquiry.id} onChange={(event) => {
                const status = event.target.value;
                if (status === "NEW" || status === "CONTACTED" || status === "CLOSED") {
                  void updateStatus(inquiry, status);
                }
              }}>
              <option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="CLOSED">Closed</option>
            </select></div>
        </article>
      ))}</section>}
    </PageContainer>
  );
}

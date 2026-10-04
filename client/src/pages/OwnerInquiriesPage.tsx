import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Inquiry, InquiryMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { InquiryConversation } from "../components/InquiryConversation";
import { ErrorMessage, LoadingState, SuccessMessage } from "../components/Feedback";
import { PageContainer } from "../components/SiteLayout";

export default function OwnerInquiriesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    const loadInquiries = () => apiRequest<{ items: Inquiry[] }>(api.get("/owner/inquiries"))
      .then((data) => setItems(data.items))
      .catch((reason: unknown) => setError(getErrorMessage(reason)));
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
    setItems((current) => current.map((item) => item.id === inquiryId
      ? { ...item, status, messages: [...(item.messages ?? []), message] }
      : item));
  }

  async function updateStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    setUpdating(inquiry.id);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ inquiry: Inquiry }>(api.patch(`/inquiries/${inquiry.id}`, { status }));
      setItems((current) => current.map((item) => item.id === inquiry.id
        ? { ...item, status: result.inquiry.status }
        : item));
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
        <h1>Property inquiries</h1><p>Message seekers about your listings and keep each conversation up to date.</p></div>
      {notice && <SuccessMessage>{notice}</SuccessMessage>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <LoadingState label="Loading inquiries..." />}
      {!loading && !items.length && !error && <div className="empty-state"><h3>No inquiries yet</h3>
        <p>When a seeker reaches out about your property, you’ll see their message here.</p>
        <Link to="/owner/properties" className="text-link">View your listings <ArrowRight size={16} /></Link></div>}
      {!!items.length && <section className="inquiry-list owner-inquiry-list">{items.map((inquiry) => (
        <article className="owner-inquiry-card" key={inquiry.id}>
          <div className="inquiry-row">
            <div className="owner-avatar">{inquiry.user?.name.charAt(0).toUpperCase()}</div>
            <div className="inquiry-main"><strong>{inquiry.user?.name} asked about
              <Link to={`/properties/${inquiry.property.id}`}> {inquiry.property.title}</Link></strong>
              <span><a href={`mailto:${inquiry.user?.email}?subject=${encodeURIComponent(`Re: ${inquiry.property.title}`)}`}>
                Email: {inquiry.user?.email}</a> · {inquiry.property.location}</span>
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
          </div>
          {user && <InquiryConversation inquiry={inquiry} user={user}
            onUpdated={(message, status) => appendMessage(inquiry.id, message, status)} />}
        </article>
      ))}</section>}
    </PageContainer>
  );
}

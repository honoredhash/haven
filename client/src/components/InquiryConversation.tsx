import { useState } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import { api, apiRequest, getErrorMessage } from "../services/api";
import type { Inquiry, InquiryMessage, User } from "../services/api";
import { ErrorMessage } from "./Feedback";

interface InquiryConversationProps {
  inquiry: Inquiry;
  user: User;
  onUpdated: (message: InquiryMessage, status: Inquiry["status"]) => void;
}

export function InquiryConversation({ inquiry, user, onUpdated }: InquiryConversationProps) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const messages = inquiry.messages ?? [];
  const closed = inquiry.status === "CLOSED";

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedReply = reply.trim();
    if (trimmedReply.length < 10 || trimmedReply.length > 2000 || sending) return;

    setSending(true);
    setError("");
    setSent(false);
    try {
      const result = await apiRequest<{ message: InquiryMessage; status: Inquiry["status"] }>(
        api.post(`/inquiries/${inquiry.id}/messages`, { message: trimmedReply })
      );
      onUpdated(result.message, result.status);
      setReply("");
      setSent(true);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="inquiry-conversation" aria-label="Inquiry conversation">
      <div className="conversation-messages" aria-live="polite">
        <article className="conversation-message conversation-message-original">
          <div><strong>{user.role === "SEEKER" ? "You" : inquiry.user?.name ?? "Seeker"}</strong>
            <span>Original inquiry</span></div>
          <p>{inquiry.message}</p>
          <time dateTime={inquiry.createdAt}>{new Date(inquiry.createdAt).toLocaleString()}</time>
        </article>
        {messages.map((message) => (
          <article className={`conversation-message${message.senderId === user.id ? " conversation-message-own" : ""}`}
            key={message.id}>
            <div><strong>{message.senderId === user.id ? "You" : message.sender.name}</strong>
              <span>{message.sender.role === "OWNER" ? "Property owner" : "Seeker"}</span></div>
            <p>{message.message}</p>
            <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
          </article>
        ))}
      </div>
      {closed
        ? <p className="conversation-closed">This conversation is closed. The owner can reopen it by changing its status.</p>
        : <form className="conversation-reply" onSubmit={(event) => void sendReply(event)}>
          <label className="visually-hidden" htmlFor={`reply-${inquiry.id}`}>Write a message</label>
          <textarea id={`reply-${inquiry.id}`} value={reply} maxLength={2000} minLength={10}
            placeholder="Write a message (10–2000 characters)" required disabled={sending}
            onChange={(event) => setReply(event.target.value)} />
          <div className="conversation-reply-footer">
            <span>Messages are visible to the seeker and property owner.</span>
            <button className="btn btn-dark rounded-pill" type="submit"
              disabled={sending || reply.trim().length < 10}>
              <Send size={15} /> {sending ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {sent && <p className="conversation-sent" role="status">Message sent.</p>}
    </section>
  );
}

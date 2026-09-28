import { AlertCircle, CheckCircle2 } from "lucide-react";

export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
      <AlertCircle size={18} className="flex-shrink-0 mt-1" /> <span>{children}</span>
    </div>
  );
}

export function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="alert alert-success d-flex align-items-start gap-2" role="status">
      <CheckCircle2 size={18} className="flex-shrink-0 mt-1" /> <span>{children}</span>
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

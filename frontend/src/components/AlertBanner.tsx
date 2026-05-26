export default function AlertBanner({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "info" | "error";
}) {
  return <div className={`alert-banner ${tone === "error" ? "alert-error" : "alert-info"}`}>{message}</div>;
}


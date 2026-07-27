/**
 * Empty section stub after Awards (TZ §4). Keeps the id so the nav pill and
 * scroll target work; no invented layout — just a muted 5by7 label. min-h 60vh.
 */
export function Placeholder({ id, label }: { id: string; label: string }) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="grid min-h-[60vh] place-items-center"
    >
      <h2 id={headingId} className="pixel text-[14px] text-ink-muted">
        {label}
      </h2>
    </section>
  );
}

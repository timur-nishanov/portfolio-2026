/**
 * How a case card on the page asks for its case. The case layer (CaseLayer)
 * listens; it opens the case over the page, out of the card that was clicked.
 * Without a listener — a page that has no layer — the link just navigates.
 */
type OpenRequest = { id: string; href: string; card: HTMLElement | null };
type Listener = (req: OpenRequest) => void;

const listeners = new Set<Listener>();

export function openCase(req: OpenRequest) {
  if (!listeners.size) {
    window.location.assign(req.href);
    return;
  }
  listeners.forEach((l) => l(req));
}

export function onOpenCase(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Sent as a case closes, so its card on the page picks up the note the
    case's copy of it had got to (CaseCard). */
export const CASE_RETURN_EVENT = 'case:return';
export type CaseReturn = { id: string; note: number };

/**
 * Notes on a board, in the page's own type rather than as a picture, so they
 * stay sharp and read as text: columns under small labels, each note a
 * square of yellow paper, or of blue (the questions in Chums, the outside
 * view in Beri Zaryad). The board is as many columns wide as it has; on a
 * phone, one (case.css).
 */

type Note = { title?: string; text?: string };
export type NoteColumn = { label: string; blue?: boolean; notes: Note[] };

export function NoteBoard({ columns, caption }: { columns: NoteColumn[]; caption: string }) {
  return (
    <figure className="cp-figure cp-reveal">
      <div className="cp-figure__box cp-board" style={{ '--cols': columns.length } as React.CSSProperties}>
        {columns.map((col) => (
          <div key={col.label} className="cp-board__col">
            <p className="cp-board__label">{col.label}</p>
            <ul>
              {col.notes.map((note, i) => (
                <li key={i} className={`cp-note${col.blue ? ' cp-note--ask' : ''}`}>
                  {note.title && <span className="cp-note__title">{note.title}</span>}
                  {note.text && <span>{note.text}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <figcaption className="cp-figure__cap">{caption}</figcaption>
    </figure>
  );
}

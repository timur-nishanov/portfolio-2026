/**
 * How the rewards system took shape (Chums, 04), as notes on a board: what
 * the PM brought, what we asked, and what we mapped from the answers — each
 * a square of paper under a small label, the questions on blue ones. Drawn
 * in the page's own type rather than as a picture, so it stays sharp and
 * reads as text.
 */

type Note = { title?: string; text?: string };
type Column = { label: string; ask?: boolean; notes: Note[] };

const COLUMNS: Column[] = [
  { label: 'The brief', notes: [{ title: 'PM’s brief', text: 'XP for activity + Venom quests' }] },
  {
    label: 'What we asked',
    ask: true,
    notes: [
      { text: 'Which metric should this move?' },
      { text: 'Why do quests at all?' },
      { text: 'Points: in Chums or at Venom?' },
      { text: 'Where do rooms come from?' },
    ],
  },
  {
    label: 'What we mapped',
    notes: [
      { title: 'Explore tab' },
      { title: 'Quest hub', text: 'What the quests are and why do them' },
      { title: 'First steps', text: 'The same steps as before, each with a reason' },
      { title: 'Regular quests', text: 'Total points, quest history, rooms' },
      { title: 'Invite a friend', text: 'Share link' },
    ],
  },
];

export function QuestBoard() {
  return (
    <figure className="cp-figure cp-reveal">
      <div className="cp-figure__box cp-board">
        {COLUMNS.map((col) => (
          <div key={col.label} className="cp-board__col">
            <p className="cp-board__label">{col.label}</p>
            <ul>
              {col.notes.map((note, i) => (
                <li key={i} className={`cp-note${col.ask ? ' cp-note--ask' : ''}`}>
                  {note.title && <span className="cp-note__title">{note.title}</span>}
                  {note.text && <span>{note.text}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <figcaption className="cp-figure__cap">How the rewards system took shape</figcaption>
    </figure>
  );
}

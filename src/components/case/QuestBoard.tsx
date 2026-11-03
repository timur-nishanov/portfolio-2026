import { NoteBoard, type NoteColumn } from './NoteBoard';

/**
 * How the rewards system took shape (Chums, 04), as notes on a board: what
 * the PM brought, what we asked, and what we mapped from the answers — the
 * questions on blue paper.
 */
const COLUMNS: NoteColumn[] = [
  { label: 'The brief', notes: [{ title: 'PM’s brief', text: 'XP for activity + Venom quests' }] },
  {
    label: 'What we asked',
    blue: true,
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
      { title: 'Quest hub', text: 'What the quests are and why they’re worth doing' },
      { title: 'First steps', text: 'The same steps as before, each with a reason' },
      { title: 'Regular quests', text: 'Total points, quest history, rooms' },
      { title: 'Invite a friend', text: 'Share link' },
    ],
  },
];

export function QuestBoard() {
  return <NoteBoard columns={COLUMNS} caption="How the rewards system took shape" />;
}

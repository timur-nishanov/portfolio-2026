/**
 * How the rewards system was meant to work (Chums, 04), drawn as boxes and
 * lines rather than a picture, so it stays sharp, reads as text and follows
 * the page's type. The questions put to the PM sit beside the parts they
 * were about.
 */

type Node = { name: string; detail?: string; question?: string };

const TRUNK: Node[] = [
  { name: 'PM’s brief', detail: 'XP for activity + Venom quests', question: 'Which metric should this move?' },
  { name: 'Explore tab' },
  { name: 'Quest hub', detail: 'What the quests are and why do them', question: 'Why do quests at all?' },
];

const BRANCHES: Node[] = [
  { name: 'First steps', detail: 'The same steps as before, each with a reason' },
  {
    name: 'Regular quests',
    detail: 'Total points, quest history, rooms',
    question: 'Points: in Chums or at Venom? Where do rooms come from?',
  },
  { name: 'Invite a friend', detail: 'Share link' },
];

function Box({ node }: { node: Node }) {
  return (
    <li className="cp-map__node">
      <div className="cp-map__box">
        <span className="cp-map__name">{node.name}</span>
        {node.detail && <span className="cp-map__detail">{node.detail}</span>}
      </div>
      {node.question && (
        <p className="cp-map__q">
          <span className="cp-map__mark" aria-hidden="true">
            ?
          </span>
          <span className="sr-only">Question: </span>
          {node.question}
        </p>
      )}
    </li>
  );
}

export function QuestMap() {
  return (
    <figure className="cp-card cp-map cp-reveal" aria-label="How the rewards system works">
      <ol className="cp-map__trunk">
        {TRUNK.map((node) => (
          <Box key={node.name} node={node} />
        ))}
        <li className="cp-map__fork">
          <ul className="cp-map__branches">
            {BRANCHES.map((node) => (
              <Box key={node.name} node={node} />
            ))}
          </ul>
        </li>
      </ol>
    </figure>
  );
}

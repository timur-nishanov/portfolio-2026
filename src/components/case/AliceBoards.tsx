/**
 * Two boards from the Alice research, as notes on a board in the page's own
 * type (as the Chums case has its QuestBoard): the jobs people would hire Alice
 * for, and what she does through the day. The yellow notes are the person's,
 * the violet ones Alice's.
 */

type Job = { when: string; want: string; alice: string };

const JOBS: Job[] = [
  { when: 'I scroll social media too much', want: 'Take a break from it', alice: 'Turns off notifications, switches on Sleep, locks the apps' },
  { when: 'I barely walk', want: 'Get out more', alice: 'A walk nearby, a trip or a place to go' },
  { when: 'The doctor gave me pills', want: 'Not miss a dose', alice: 'Reminders that fit around the day' },
  { when: 'I have work calls', want: 'Not miss anything said', alice: 'The key points, the next steps and the recording' },
  { when: 'I can’t pick what to watch tonight', want: 'Have a good evening', alice: 'A film picked from Kinopoisk, dinner from Yandex Eda' },
];

/** The jobs: what happens, what you want then, and what Alice does about it,
    a row each. */
export function AliceJobs() {
  return (
    <figure className="cp-figure cp-reveal">
      <div className="cp-figure__box cp-board cp-board--rows">
        <p className="cp-board__label">When…</p>
        <p className="cp-board__label">I want to…</p>
        <p className="cp-board__label">So Alice…</p>
        {JOBS.map((job) => (
          <div key={job.when} className="cp-board__row">
            <p className="cp-note">{job.when}</p>
            <p className="cp-note">{job.want}</p>
            <p className="cp-note cp-note--alice">{job.alice}</p>
          </div>
        ))}
      </div>
      <figcaption className="cp-figure__cap">The jobs people would hire Alice for</figcaption>
    </figure>
  );
}

type Moment = { title: string; text: string; on: 'Phone' | 'Mac' };
type Time = { time: string; label: string; moments: Moment[] };

const DAY: Time[] = [
  {
    time: '08:00',
    label: 'Morning',
    moments: [
      { title: 'You wake up', text: 'How you slept, and a short warm-up', on: 'Phone' },
      { title: 'Breakfast time', text: 'A menu from your usual orders, here in 15 minutes', on: 'Phone' },
      { title: 'The daily is soon', text: 'Yesterday in short, and a countdown to join', on: 'Phone' },
    ],
  },
  {
    time: '14:00',
    label: 'Work',
    moments: [
      { title: 'A mockup to review', text: 'Feedback on a Figma frame, in the notch', on: 'Mac' },
      { title: 'A call in 6 minutes', text: 'Everything for it on one card', on: 'Phone' },
      { title: 'Hours at the desk', text: 'A break, and a timer for it', on: 'Mac' },
    ],
  },
  {
    time: '19:00',
    label: 'Evening',
    moments: [
      { title: 'Steps, sleep, screen time', text: 'A weekend away: a route, tickets, a hotel', on: 'Phone' },
      { title: 'A free evening', text: 'A film, and dinner to go with it', on: 'Phone' },
      { title: 'Before bed', text: 'How was your day?', on: 'Phone' },
    ],
  },
];

/** The day as we planned it: three times, and at each what Alice notices and
    what she brings, on the phone or the Mac. */
export function AliceDay() {
  return (
    <figure className="cp-figure cp-reveal">
      <div className="cp-figure__box cp-board">
        {DAY.map((col) => (
          <div key={col.time} className="cp-board__col">
            <p className="cp-board__label">
              <span className="cp-board__time">{col.time}</span> {col.label}
            </p>
            <ul>
              {col.moments.map((m) => (
                <li key={m.title} className="cp-note">
                  <span className="cp-note__title">{m.title}</span>
                  <span>{m.text}</span>
                  <span className="cp-note__tag">{m.on}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <figcaption className="cp-figure__cap">What Alice does through the day</figcaption>
    </figure>
  );
}

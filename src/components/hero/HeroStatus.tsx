'use client';

import { useEffect, useState } from 'react';

const bangkokTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Bangkok',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function HeroStatus() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(bangkokTime.format(new Date()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <p className="pixel absolute inset-x-4 bottom-[clamp(24px,5vw,72px)] text-center text-ink-muted">
      BANGKOK{time ? ` ${time}` : ''} · AVAILABLE FOR REMOTE WORK
    </p>
  );
}

import { useEffect, useState } from 'react';

const RESEND_COOLDOWN_SECONDS = 60;

export default function useOtpResendCountdown(initialSeconds = 0) {
  const [deadline, setDeadline] = useState(() => Date.now() + initialSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline <= Date.now()) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [deadline]);

  const secondsRemaining = Math.max(0, Math.ceil((deadline - now) / 1000));

  function startCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
    setDeadline(Date.now() + seconds * 1000);
    setNow(Date.now());
  }

  return { secondsRemaining, startCooldown };
}

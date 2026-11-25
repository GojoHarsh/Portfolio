"use client";

import { useEffect, useState } from "react";

const format = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * The time where Harsh is (India Standard Time). Filled in after mount, so
 * the server-rendered page and the first client render agree.
 */
export function LocalTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;
  return (
    <time dateTime={now.toISOString()} className="tabular-nums">
      {format.format(now)} IST
    </time>
  );
}

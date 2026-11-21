"use client";

import { useEffect, useState } from "react";
import { deadlineLabel } from "@/lib/timezone";

export function Deadline({ dueAt }: { dueAt: Date | string }) {
  const [timezone, setTimezone] = useState<string>();
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return <time dateTime={new Date(dueAt).toISOString()}>
    {timezone ? deadlineLabel(dueAt, timezone) : "Loading deadline…"}
  </time>;
}

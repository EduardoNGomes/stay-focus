export function parseTime(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value ?? "")) {
    throw new Error("Choose a valid time in HH:MM format.");
  }
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function validateSchedule(schedule) {
  const start = parseTime(schedule?.start);
  const end = parseTime(schedule?.end);
  if (start === end) {
    throw new Error("Start and end times must be different.");
  }
  return { start, end };
}

function localBoundary(day, minutes) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

export function getScheduleState(schedule, now = new Date()) {
  const { start, end } = validateSchedule(schedule);
  const minuteNow = now.getHours() * 60 + now.getMinutes();
  const active = start < end
    ? minuteNow >= start && minuteNow < end
    : minuteNow >= start || minuteNow < end;

  const boundaries = [];
  for (let offset = -1; offset <= 2; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    boundaries.push({ kind: "start", at: localBoundary(day, start).getTime() });
    boundaries.push({ kind: "end", at: localBoundary(day, end).getTime() });
  }
  const future = boundaries.filter(({ at }) => at > now.getTime()).sort((a, b) => a.at - b.at);
  const nextEndAt = future.find(({ kind }) => kind === "end")?.at;
  return {
    active,
    windowEndAt: active ? nextEndAt : null,
    nextWindowEndAt: nextEndAt,
    nextTransitionAt: future[0]?.at
  };
}

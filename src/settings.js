export const DEFAULT_POMODORO = Object.freeze({
  focusMinutes: 25,
  breakMinutes: 5,
  sites: [],
  mode: "normal",
  state: "idle",
  anchorAt: null,
  pausedElapsedMs: 0
});

export const DEFAULT_SETTINGS = Object.freeze({
  schemaVersion: 2,
  sessions: [],
  pomodoro: DEFAULT_POMODORO
});

export function migrateSettings(settings, idFactory = () => crypto.randomUUID()) {
  if (settings?.schemaVersion === 2 && Array.isArray(settings.sessions)) {
    return {
      schemaVersion: 2,
      sessions: settings.sessions.map((session) => ({
        ...session,
        sites: Array.isArray(session.sites) ? session.sites : [],
        schedule: { start: "13:00", end: "18:00", ...session.schedule },
        mode: session.mode === "hardcore" ? "hardcore" : "normal",
        normalPauseUntil: session.normalPauseUntil ?? null
      })),
      pomodoro: {
        ...DEFAULT_POMODORO,
        ...settings.pomodoro,
        sites: Array.isArray(settings.pomodoro?.sites) ? settings.pomodoro.sites : []
      }
    };
  }

  const sessions = settings?.schedule ? [{
    id: idFactory(),
    name: "Focus session",
    sites: Array.isArray(settings.sites) ? settings.sites : [],
    schedule: { start: "13:00", end: "18:00", ...settings.schedule },
    mode: settings.mode === "hardcore" ? "hardcore" : "normal",
    normalPauseUntil: settings.normalPauseUntil ?? null
  }] : [];

  return {
    schemaVersion: 2,
    sessions,
    pomodoro: { ...DEFAULT_POMODORO, sites: [] }
  };
}

export async function loadSettings(storage = chrome.storage.local) {
  const { settings } = await storage.get("settings");
  return migrateSettings(settings);
}

export async function ensureSettings(storage = chrome.storage.local) {
  const { settings } = await storage.get("settings");
  if (settings?.schemaVersion !== 2) {
    await storage.set({ settings: migrateSettings(settings) });
  }
}

export async function saveSettings(settings, storage = chrome.storage.local) {
  await storage.set({ settings });
}

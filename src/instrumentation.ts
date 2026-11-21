export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "development" ||
      !process.env.DATABASE_URL?.includes("127.0.0.1:5439/")) return;
  const state = globalThis as typeof globalThis & { plannerReminderTimer?: NodeJS.Timeout };
  if (state.plannerReminderTimer) return;
  const { sendDueReminders } = await import("./lib/reminders");
  state.plannerReminderTimer = setInterval(() => {
    sendDueReminders().catch(() => console.warn("Local deadline reminder check failed."));
  }, 60_000);
  state.plannerReminderTimer.unref();
}

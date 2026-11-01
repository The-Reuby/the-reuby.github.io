// Helpers for submission deadlines stored as "YYYY-MM-DD" in guidelines.json.
// A deadline counts as open until the end of that day, local time.

const endOfDay = (deadline: string) => new Date(`${deadline}T23:59:59`);

export const isDeadlineOpen = (deadline: string) => endOfDay(deadline) >= new Date();

export const daysUntil = (deadline: string) =>
  Math.max(0, Math.ceil((endOfDay(deadline).getTime() - Date.now()) / 86_400_000));

export const formatDeadline = (deadline: string) =>
  new Date(`${deadline}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

// Helpers for submission deadlines stored as "YYYY-MM-DD" in guidelines.json.
// A deadline counts as open until the end of that day, local time.

const endOfDay = (deadline: string) => new Date(`${deadline}T23:59:59`);

export const isDeadlineOpen = (deadline: string) => endOfDay(deadline) >= new Date();

// Whole days from today to the deadline's date, so 0 on the day itself.
// Rounded, as a day across a clock change is 23 or 25 hours long.
export const daysUntil = (deadline: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((new Date(`${deadline}T00:00:00`).getTime() - today.getTime()) / 86_400_000));
};

export const formatDeadline = (deadline: string) =>
  new Date(`${deadline}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

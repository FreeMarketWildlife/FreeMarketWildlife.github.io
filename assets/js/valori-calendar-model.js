// Both sections start empty. No records are seeded or read from other workspaces.
export const personalItems = Object.freeze([]);
export const businessItems = Object.freeze([]);

export function combinedItems(personal = personalItems, business = businessItems) {
  return [...personal.map(item => ({...item, category: 'Personal'})),
    ...business.map(item => ({...item, category: 'Bookkeeping Business'}))]
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function monthCells(year, month) {
  const start = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({length: Math.ceil((start + days) / 7) * 7}, (_, index) => {
    const day = index - start + 1;
    return day > 0 && day <= days ? day : null;
  });
}

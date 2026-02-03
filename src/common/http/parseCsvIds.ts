export const parseCsvIds = (value?: string): string[] => {
  if (!value) return [];
  const items = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
};

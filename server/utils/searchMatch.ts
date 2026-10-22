export interface SearchableHackathon {
  title?: string | null;
  description?: string | null;
  skills?: Array<string | null | undefined> | null;
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive whole-token match against the hackathon's skills, title and
// description. Token boundaries let "ai" match "Machine Learning/AI" while
// still refusing to match inside unrelated words such as "paid" or "blockchain".
// Title/description fallback keeps sources like MLH (which have no skills) searchable.
export const matchesSearchTerm = (
  term: string,
  hackathon: SearchableHackathon
): boolean => {
  if (typeof term !== 'string') return false;
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return false;

  const haystacks = [
    ...(Array.isArray(hackathon.skills) ? hackathon.skills : []),
    hackathon.title,
    hackathon.description
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.toLowerCase());

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`
  );
  return haystacks.some((text) => pattern.test(text));
};

// `prize` is free text (e.g. "$138,000", "$0", "0", "No prize"). It counts as a
// real prize only when stripping non-digits leaves a number greater than zero.
export const hasPrizeValue = (prize: unknown): boolean => {
  if (typeof prize === 'number') return Number.isFinite(prize) && prize > 0;
  if (typeof prize !== 'string') return false;
  const digits = prize.replace(/[^0-9]/g, '');
  return digits.length > 0 && Number(digits) > 0;
};

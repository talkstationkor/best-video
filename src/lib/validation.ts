export class ValidationError extends Error {}

// Loose but real validation: must be an https URL on a Google Drive-family
// host. We don't try to guarantee the file is share-permissioned (that is
// a Drive-side concern), only that it looks like a legitimate Drive link
// rather than an arbitrary/unsafe URL.
const ALLOWED_HOSTS = ["drive.google.com", "docs.google.com"];

export function validateGoogleDriveUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    throw new ValidationError("A Google Drive video link is required.");
  }
  const value = raw.trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ValidationError("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new ValidationError("The video link must use https://.");
  }
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    throw new ValidationError(
      "The video link must be a Google Drive link (drive.google.com)."
    );
  }
  return value;
}

// Strips control characters and clamps length. React escapes output for us
// (no dangerouslySetInnerHTML is used anywhere in this app), so this is a
// defense-in-depth layer against junk/oversized input reaching the DB.
export function sanitizeText(raw: unknown, maxLength = 4000): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function requireNonEmpty(raw: unknown, fieldLabel: string): string {
  const value = sanitizeText(raw, 200);
  if (!value) throw new ValidationError(`${fieldLabel} is required.`);
  return value;
}

// Extracts a Google Drive file id so we can build a stable embeddable
// preview URL regardless of which link format the user pasted.
export function toDriveEmbedUrl(driveUrl: string): string | null {
  const idMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const idFromQuery = driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = idMatch?.[1] ?? idFromQuery?.[1];
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

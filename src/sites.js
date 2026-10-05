export function normalizeSiteInput(input) {
  const raw = String(input ?? "").trim();
  if (!raw || /\s/.test(raw)) {
    throw new Error("Enter a site without spaces.");
  }

  const value = raw.includes("://") ? raw : `https://${raw}`;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid domain or website URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS websites are supported.");
  }
  if (url.username || url.password) {
    throw new Error("URLs with usernames or passwords are not supported.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if (host.length > 253 || labels.some((label) => label.length > 63 || !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/.test(label))) {
    throw new Error("Enter a valid website hostname.");
  }
  return host;
}

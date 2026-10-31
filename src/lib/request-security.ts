/** Require an explicit browser origin matching the destination Host header.
 * The internal Next.js URL may use a bind address behind a reverse proxy.
 * Host is a forbidden request header in browser fetch; never use a client-supplied
 * body field or an arbitrary forwarded host as the authority.
 */
export function assertSameOrigin(headers: Headers) {
  const origin = headers.get("origin");
  if (origin === null || origin === "null" || origin === "")
    throw new Error("Origin header required.");
  const destination = headers.get("host");
  if (!destination) throw new Error("Destination host required.");
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error("Invalid request origin.");
  }
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.origin !== origin ||
    parsed.host !== destination
  )
    throw new Error("Invalid request origin.");
}

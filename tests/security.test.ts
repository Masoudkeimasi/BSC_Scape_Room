import { expect, it } from "vitest";
import { assertSameOrigin } from "../src/lib/request-security";
it("rejects absent, empty, opaque and foreign origins", () => {
  for (const origin of [
    undefined,
    "",
    "null",
    "https://attacker.example",
    "https://example.com.attacker.test",
    "http://example.com/path",
    "file://example.com",
  ]) {
    const h = new Headers({ host: "example.com" });
    if (origin !== undefined) h.set("origin", origin);
    expect(() => assertSameOrigin(h)).toThrow();
  }
});
it("requires explicit matching hosts and ports", () => {
  expect(() =>
    assertSameOrigin(
      new Headers({ origin: "http://localhost:3000", host: "localhost:3000" }),
    ),
  ).not.toThrow();
  expect(() =>
    assertSameOrigin(
      new Headers({ origin: "https://example.com", host: "example.com" }),
    ),
  ).not.toThrow();
  expect(() =>
    assertSameOrigin(
      new Headers({ origin: "http://localhost:3001", host: "localhost:3000" }),
    ),
  ).toThrow();
});
it("ignores forged forwarded-host headers", () =>
  expect(() =>
    assertSameOrigin(
      new Headers({
        origin: "https://attacker.test",
        host: "example.com",
        "x-forwarded-host": "attacker.test",
      }),
    ),
  ).toThrow());

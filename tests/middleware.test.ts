import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { middleware } from "../src/middleware";

/**
 * The app runs behind nginx, bound to loopback. Next builds the absolute URL
 * for a redirect from the address the process is bound to rather than from
 * the Host header, so an absolute Location sends the visitor to
 * http://localhost:3100 — an address that, from a browser, is their own
 * machine. The symptom is a site that answers every request with a redirect
 * into nowhere, and it appears only once there is a proxy in front, which is
 * to say only in production.
 *
 * Every redirect the middleware issues must therefore carry a relative
 * Location, which the browser resolves against the address it actually asked
 * for. These tests pin that down for the paths that redirect without needing
 * a session.
 */
describe("middleware redirects", () => {
  const ask = (path: string) =>
    middleware(
      new NextRequest(
        new Request(`http://localhost:3100${path}`, {
          headers: { host: "capibara.uz" },
        }),
      ),
    );

  const assertRelative = (location: string | null) => {
    assert.ok(location, "a redirect must carry a Location header");
    assert.doesNotMatch(
      location,
      /^[a-z]+:\/\//i,
      `Location must not name an origin, got ${location}`,
    );
    assert.ok(
      location.startsWith("/"),
      `Location must be an absolute path, got ${location}`,
    );
  };

  test("a path with no language segment", async () => {
    const response = await ask("/");
    assert.equal(response.status, 308);
    assertRelative(response.headers.get("location"));
  });

  test("a deep path with no language segment", async () => {
    const response = await ask("/catalog/some-book");
    assert.equal(response.status, 308);
    const location = response.headers.get("location");
    assertRelative(location);
    assert.ok(location?.endsWith("/catalog/some-book"));
  });

  test("a query string survives the redirect", async () => {
    const response = await ask("/catalog?sort=price");
    assertRelative(response.headers.get("location"));
    assert.ok(response.headers.get("location")?.includes("?sort=price"));
  });

  test("a locale segment from when the markets shared a site", async () => {
    const response = await ask("/ru-uz/catalog");
    assert.equal(response.status, 308);
    const location = response.headers.get("location");
    assertRelative(location);
    assert.ok(location?.endsWith("/catalog"));
  });
});

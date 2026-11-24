import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { middleware } from "../src/middleware";

/**
 * Routing rules, checked at the level of the path a visitor ends up on.
 *
 * The Location header these redirects carry is a full URL whose origin is the
 * address the Node process is bound to, not the address the visitor asked
 * for. That is Next's doing and it cannot be changed from here: a relative
 * Location makes Next's own runtime throw `ERR_INVALID_URL` before the
 * response ever leaves. nginx rewrites the origin away in front of the app —
 * see the proxy_redirect lines in provision-uz.sh — and deploy-uz.sh fails
 * the deployment if that rewriting is missing, because this is a fault no
 * test of the middleware alone can see.
 *
 * So these assertions read the path out of the Location and ignore its
 * origin, which is the part that is nginx's business.
 */
describe("middleware routing", () => {
  const ask = (path: string) =>
    middleware(
      new NextRequest(
        new Request(`http://localhost:3100${path}`, {
          headers: { host: "capibara.uz" },
        }),
      ),
    );

  const target = (response: Response) => {
    const location = response.headers.get("location");
    assert.ok(location, "a redirect must carry a Location header");
    const url = new URL(location);
    return `${url.pathname}${url.search}`;
  };

  test("a path with no language segment gains one", async () => {
    const response = await ask("/");
    assert.equal(response.status, 308);
    assert.match(target(response), /^\/[a-z-]+$/);
  });

  test("the rest of the path survives", async () => {
    const response = await ask("/catalog/some-book");
    assert.equal(response.status, 308);
    assert.ok(target(response).endsWith("/catalog/some-book"));
  });

  test("the query string survives", async () => {
    const response = await ask("/catalog?sort=price");
    assert.ok(target(response).endsWith("/catalog?sort=price"));
  });

  test("a locale segment from when the markets shared a site is replaced", async () => {
    const response = await ask("/ru-uz/catalog");
    assert.equal(response.status, 308);
    const path = target(response);
    assert.ok(path.endsWith("/catalog"), path);
    assert.ok(!path.includes("ru-uz"), path);
  });

  test("a language this market serves is left alone", async () => {
    const response = await ask("/ru/catalog");
    assert.equal(response.status, 200);
  });
});

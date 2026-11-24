import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * A component that calls a hook has to say "use client".
 *
 * Forget the directive and nothing stops the build: the component keeps its
 * types, keeps compiling, and keeps passing every test that renders it in
 * isolation. It fails at request time, on the server, where React refuses to
 * call a client export — and Next catches that, logs it and quietly swaps in
 * a fallback. The page still answers 200, so nothing looks wrong from
 * outside.
 *
 * It cost us the 404 page: NotFoundContent threw on every request and Uzbek
 * visitors who mistyped a URL were shown Next's stock English "This page
 * could not be found" instead of the page we wrote. The testimonial card had
 * the same defect, waiting for the first review to be published.
 *
 * Reading the source is the only way to catch this before a server does.
 */
const HOOKS = [
  "useDictionary",
  "useLanguage",
  "useLocale",
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "useContext",
  "useReducer",
  "useRouter",
  "useSearchParams",
  "usePathname",
  "useFormStatus",
];

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...sourceFiles(full));
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      found.push(full);
    }
  }
  return found;
}

describe("the client boundary", () => {
  test("every file that calls a hook declares \"use client\"", () => {
    const root = path.join(process.cwd(), "src");
    const offenders: string[] = [];

    for (const file of sourceFiles(root)) {
      const source = readFileSync(file, "utf8");
      if (/^["']use client["'];?/m.test(source.slice(0, 200))) continue;

      // A hook call, not a definition and not a mention in prose.
      const called = HOOKS.filter((hook) =>
        new RegExp(`(?<![\\w.])${hook}\\s*(<[^>]*>)?\\s*\\(`).test(
          source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
        ),
      );
      if (called.length > 0) {
        offenders.push(`${path.relative(root, file)} calls ${called.join(", ")}`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `these call React hooks from the server:\n  ${offenders.join("\n  ")}`,
    );
  });
});

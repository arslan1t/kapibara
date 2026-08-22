/**
 * Produces the reference scenes used as Img 1 in illustration generation.
 *
 *   NANO_BANANA_API_KEY=... npx tsx scripts/generate-scenes.ts [sceneId ...]
 *
 * Run once and commit the result. These are fixed artwork, not something to
 * regenerate per order: the whole purpose of a reference scene is that every
 * book in an age band shares one world, and regenerating gives a different one.
 *
 * Existing files are left alone unless --force is passed, so a rerun after
 * adding one band does not silently replace the others.
 */
import { writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { AGE_SCENES } from "../src/lib/generation/scenes";

const API = (process.env.NANO_BANANA_API_URL ?? "https://api.kie.ai/api/v1").replace(/\/$/, "");
const KEY = process.env.NANO_BANANA_API_KEY?.trim();
const MODEL = process.env.NANO_BANANA_MODEL ?? "nano-banana-pro";

const force = process.argv.includes("--force");
const wanted = process.argv.slice(2).filter((a) => !a.startsWith("--"));

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function createTask(prompt: string): Promise<string> {
  const response = await fetch(`${API}/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      input: {
        prompt,
        image_input: [],
        aspect_ratio: "1:1",
        resolution: "2K",
        output_format: "png",
      },
    }),
  });

  const body = await response.json();
  if (body?.code !== 200) throw new Error(body?.msg ?? `HTTP ${response.status}`);

  const id = body.data?.taskId ?? body.data?.recordId;
  if (!id) throw new Error("no task id returned");
  return id;
}

async function waitForResult(taskId: string): Promise<string> {
  const deadline = Date.now() + 5 * 60_000;

  while (Date.now() < deadline) {
    const response = await fetch(`${API}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    const body = await response.json();
    const data = body?.data;
    const state = String(data?.state ?? "").toLowerCase();

    if (state === "success") {
      const urls = JSON.parse(data.resultJson ?? "{}").resultUrls;
      if (!Array.isArray(urls) || !urls[0]) throw new Error("no result url");
      return urls[0] as string;
    }
    if (state && !["waiting", "queuing", "queued", "generating", "processing"].includes(state)) {
      throw new Error(data?.failMsg ?? `state=${state}`);
    }
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error("timed out");
}

async function main() {
  if (!KEY) {
    console.error("NANO_BANANA_API_KEY is not set.");
    process.exit(1);
  }

  const scenes = wanted.length
    ? AGE_SCENES.filter((s) => wanted.includes(s.id))
    : AGE_SCENES;

  if (scenes.length === 0) {
    console.error(`No scene matched. Known ids: ${AGE_SCENES.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }

  for (const scene of scenes) {
    const target = path.join(process.cwd(), "public", scene.file);

    if (!force && (await exists(target))) {
      console.log(`• ${scene.id.padEnd(14)} уже существует, пропуск`);
      continue;
    }

    process.stdout.write(`• ${scene.id.padEnd(14)} генерация… `);
    const taskId = await createTask(scene.scenePrompt);
    const url = await waitForResult(taskId);

    const image = await fetch(url);
    const bytes = Buffer.from(await image.arrayBuffer());

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    console.log(`готово, ${(bytes.byteLength / 1024).toFixed(0)} КБ`);
  }
}

main().catch((error) => {
  console.error("\n" + (error instanceof Error ? error.message : String(error)));
  process.exit(1);
});

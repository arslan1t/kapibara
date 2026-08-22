import { SITE_URL_FALLBACK } from "@/lib/constants";

/**
 * Reference scenes for illustration generation.
 *
 * The provider is given two images: a scene that fixes the world, the lighting
 * and the palette, and the child's photograph that fixes who the character is.
 * Without the first, every book comes back looking like a different product;
 * fixing the environment is what makes a series look like a series.
 *
 * Scenes are chosen by the child's age, because what a three-year-old should be
 * looking at is not what a ten-year-old wants. The bands match how the catalogue
 * already describes its books.
 *
 * The files live in /public and are served from our own domain. They must be
 * fetchable by URL — the provider pulls them itself — which rules out the
 * private bucket, and that is fine: these are our own artwork, not anyone's
 * photograph.
 */

export interface AgeScene {
  id: string;
  label: string;
  /** Inclusive lower bound in years. */
  ageMin: number;
  /** Inclusive upper bound in years. */
  ageMax: number;
  /** Path under /public. */
  file: string;
  /**
   * What the scene depicts. Used to generate the reference art in the first
   * place (scripts/generate-scenes.ts) and kept here so regenerating it
   * produces the same world rather than a new one.
   */
  scenePrompt: string;
}

export const AGE_SCENES: readonly AgeScene[] = [
  {
    id: "toddler",
    label: "1–3 года",
    ageMin: 1,
    ageMax: 3,
    file: "/scenes/toddler.jpg",
    scenePrompt:
      "Pixar-style 3D animated scene, empty of characters: a soft sunny meadow with oversized friendly flowers, rounded gentle hills, pastel butterflies, warm golden hour light, very soft shadows, calm and safe atmosphere for a toddler picture book. No people, no text.",
  },
  {
    id: "preschool",
    label: "3–5 лет",
    ageMin: 3,
    ageMax: 5,
    file: "/scenes/preschool.jpg",
    scenePrompt:
      "Pixar-style 3D animated scene, empty of characters: a magical forest glade with glowing mushrooms, a small wooden bridge over a clear stream, fireflies, saturated greens, warm rim light through the trees, cheerful fairy-tale atmosphere. No people, no text.",
  },
  {
    id: "early-school",
    label: "5–8 лет",
    ageMin: 5,
    ageMax: 8,
    file: "/scenes/early-school.jpg",
    scenePrompt:
      "Pixar-style 3D animated scene, empty of characters: an adventure valley with a winding path, a waterfall, floating rocks and a distant castle, dramatic sunset rim lighting, vivid blues and oranges, sense of a journey beginning. No people, no text.",
  },
  {
    id: "school",
    label: "8–12 лет",
    ageMin: 8,
    ageMax: 12,
    file: "/scenes/school.jpg",
    scenePrompt:
      "Pixar-style 3D animated scene, empty of characters: a grand fantasy landscape at dusk with airships in the sky, cliffside city lights, stylized clouds, cool blues with warm accent lights, epic but friendly. No people, no text.",
  },
] as const;

/** Falls back to the middle band rather than failing: a book is better than an error. */
export const DEFAULT_SCENE_ID = "early-school";

export function sceneForAge(age: number | null | undefined): AgeScene {
  if (typeof age === "number" && Number.isFinite(age)) {
    const match = AGE_SCENES.find((s) => age >= s.ageMin && age <= s.ageMax);
    if (match) return match;
    // Older than every band: use the oldest rather than the default.
    const oldest = AGE_SCENES[AGE_SCENES.length - 1]!;
    if (age > oldest.ageMax) return oldest;
  }
  return AGE_SCENES.find((s) => s.id === DEFAULT_SCENE_ID) ?? AGE_SCENES[0]!;
}

export function sceneById(id: string | null | undefined): AgeScene {
  return AGE_SCENES.find((s) => s.id === id) ?? sceneForAge(null);
}

/**
 * Absolute URL for a scene file.
 *
 * Absolute because the provider fetches it from its own servers, where a
 * site-relative path means nothing.
 */
export function sceneUrl(scene: AgeScene): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_URL_FALLBACK
  ).replace(/\/$/, "");
  return `${base}${scene.file}`;
}

export type PromptCategory = "Nature" | "Portrait" | "Architecture" | "Fantasy & Sci-Fi" | "Abstract";

export type CuratedPrompt = {
  text: string;
  category: PromptCategory;
  negative?: string;
};

export const CURATED_PROMPTS: CuratedPrompt[] = [
  {
    text: "A hidden waterfall deep inside a lush green forest, sunlight rays passing through trees, cinematic, ultra realistic, peaceful atmosphere",
    category: "Nature",
    negative: "blurry, low quality, ugly, distorted, extra legs, extra eyes, deformed, cropped, watermark, text, logo, bad anatomy",
  },
  {
    text: "Bioluminescent coral reef at midnight, tiny glowing jellyfish drifting, deep blue water, macro photography, national geographic",
    category: "Nature",
    negative: "blurry, noise, artificial light, diver, plastic",
  },
  {
    text: "Abandoned Gothic library, dust particles in sunbeams, towering bookshelves, spiral iron staircase, melancholic beauty",
    category: "Architecture",
    negative: "people, modern elements, graffiti, broken windows, debris",
  },
  {
    text: "Weathered fisherman on a wooden boat at dawn, golden hour light on wrinkled face, storm clouds on horizon, documentary portrait",
    category: "Portrait",
    negative: "smile, sunglasses, modern clothing, plastic, text",
  },
  {
    text: "Cyberpunk street vendor in neon Tokyo, rain-slicked alley, holographic signs, steam rising from food cart, cinematic noir",
    category: "Portrait",
    negative: "daylight, clear sky, crowds, cars, modern clean streets",
  },
  {
    text: "Minimalist concrete chapel in snow-covered forest, warm amber light glowing from within, brutalist architecture, serene winter dusk",
    category: "Architecture",
    negative: "people, cars, modern city, colorful decorations, text",
  },
  {
    text: "A majestic crystal dragon sleeping inside a geode cavern, refracted light, volumetric fog, intricate scales, matte painting",
    category: "Fantasy & Sci-Fi",
    negative: "cartoon, anime, low poly, watermark, blurry",
  },
  {
    text: "Cyberpunk city street at monsoon night, neon reflections in puddles, crowded market stalls, flying cars overhead, blade runner aesthetic",
    category: "Fantasy & Sci-Fi",
    negative: "daylight, clear sky, desert, modern clean streets",
  },
  {
    text: "An ancient alien observatory on a cliff overlooking a ringed gas giant, milky way above, moss-covered stone, cinematic wide shot",
    category: "Fantasy & Sci-Fi",
    negative: "earth, modern buildings, people, spaceship, text",
  },
  {
    text: "Macro photography of a dewdrop on a spiderweb at sunrise, bokeh forest background, sharp focus, National Geographic style",
    category: "Nature",
    negative: "blurry, artificial light, hand, plastic, text",
  },
  {
    text: "Elderly Japanese blacksmith in his forge, sparks flying, warm orange glow on weathered face, shallow depth of field",
    category: "Portrait",
    negative: "smile, modern clothing, electric tools, safety glasses, text",
  },
  {
    text: "Abandoned Art Deco ballroom, peeling gold leaf, broken chandeliers, overgrown ivy through shattered windows, melancholic beauty",
    category: "Architecture",
    negative: "people, modern furniture, graffiti, construction, text",
  },
  {
    text: "Ink dropped in water forming a phoenix shape, black and gold on white, high speed photography, fluid dynamics",
    category: "Abstract",
    negative: "blurry, color, background, texture, text",
  },
  {
    text: "African savanna golden hour, lone acacia tree, herd of elephants in distance, dust particles in light beam, 8k uhd",
    category: "Nature",
    negative: "tourists, vehicles, fences, buildings, text",
  },
  {
    text: "Underwater kelp forest with light rays piercing surface, sea turtles swimming, bioluminescent plankton, documentary style",
    category: "Nature",
    negative: "diver, plastic, pollution, artificial light, text",
  },
  {
    text: "Steampunk inventor in brass goggles, leather apron, workshop full of gears and blueprints, warm tungsten lamp light",
    category: "Portrait",
    negative: "modern clothing, electric light, computer, clean room, text",
  },
  {
    text: "Futuristic Scandinavian library, floor-to-ceiling bookshelves, spiral staircase, soft natural light, minimalist concrete and wood",
    category: "Architecture",
    negative: "people, clutter, neon, dark, text",
  },
  {
    text: "Fractal landscape made of glass and ice, impossible geometry, rainbow caustics, escher-inspired",
    category: "Abstract",
    negative: "blurry, low resolution, watermark, text, noise",
  },
];

export function getRandomPrompts(count: number, exclude?: string): CuratedPrompt[] {
  const pool = exclude
    ? CURATED_PROMPTS.filter((p) => p.text !== exclude)
    : [...CURATED_PROMPTS];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

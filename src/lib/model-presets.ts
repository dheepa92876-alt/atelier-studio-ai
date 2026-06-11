export type ModelPreset = {
  steps: number;
  cfg: number;
  width: number;
  height: number;
  note: string;
};

// Curated defaults tuned per model family. Goal: similar quality with the
// lowest sensible step count, so jobs pick up faster on rarer workers.
const PRESETS: Array<{ match: RegExp; preset: ModelPreset }> = [
  {
    match: /^stable_diffusion$|^stable diffusion$/i,
    preset: { steps: 25, cfg: 7, width: 512, height: 512, note: "Base SD 1.5 — 20–30 steps, CFG 7, 512²." },
  },
  {
    match: /sdxl|stable_diffusion_xl|stable diffusion xl/i,
    preset: { steps: 30, cfg: 7, width: 1024, height: 1024, note: "SDXL — 25–35 steps, CFG 6–8, 1024² native." },
  },
  {
    match: /turbo|lightning|lcm|hyper/i,
    preset: { steps: 8, cfg: 2, width: 512, height: 512, note: "Distilled model — 4–10 steps, CFG 1–2." },
  },
  {
    match: /flux/i,
    preset: { steps: 20, cfg: 3.5, width: 1024, height: 1024, note: "Flux — 20 steps, CFG ~3.5, 1024²." },
  },
  {
    match: /dreamshaper|deliberate|realistic[_ ]?vision|epicrealism|cyberrealistic|absolutereality|rev[_ ]?animated|anything|meinamix|counterfeit|abyssorangemix|ghostmix|majicmix/i,
    preset: { steps: 20, cfg: 7, width: 512, height: 768, note: "SD 1.5 fine-tune — 20 steps is plenty, CFG 6–8, portrait 512×768." },
  },
  {
    match: /pony|illustrious|noobai|animagine/i,
    preset: { steps: 25, cfg: 6, width: 832, height: 1216, note: "SDXL anime fine-tune — 25 steps, CFG 5–7, ~832×1216." },
  },
];

const FALLBACK: ModelPreset = {
  steps: 25,
  cfg: 7,
  width: 512,
  height: 512,
  note: "No tuned preset — 25 steps, CFG 7, 512² is a safe default.",
};

export function getModelPreset(model: string): ModelPreset {
  for (const p of PRESETS) if (p.match.test(model)) return p.preset;
  return FALLBACK;
}
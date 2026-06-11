import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE = "https://aihorde.net/api/v2";

function key() {
  const k = process.env.AI_HORDE_API_KEY;
  if (!k) throw new Error("AI_HORDE_API_KEY is not configured");
  return k;
}

export const submitGeneration = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      prompt: z.string().min(1).max(2000),
      negative_prompt: z.string().max(2000).optional().default(""),
      width: z.number().int().min(64).max(1024),
      height: z.number().int().min(64).max(1024),
      steps: z.number().int().min(1).max(50),
      cfg_scale: z.number().min(1).max(20),
      model: z.string().min(1).max(120),
    }),
  )
  .handler(async ({ data }) => {
    const finalPrompt = data.negative_prompt
      ? `${data.prompt} ### ${data.negative_prompt}`
      : data.prompt;

    const res = await fetch(`${BASE}/generate/async`, {
      method: "POST",
      headers: {
        apikey: key(),
        "Content-Type": "application/json",
        "Client-Agent": "lovable-horde-app:1.0:lovable",
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        params: {
          width: data.width,
          height: data.height,
          steps: data.steps,
          cfg_scale: data.cfg_scale,
        },
        models: [data.model],
        nsfw: false,
        r2: true,
      }),
    });

    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok || !json.id) {
      throw new Error(json.message ?? `Submit failed (${res.status})`);
    }
    return { id: json.id };
  });

export const checkGeneration = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/generate/check/${data.id}`);
    if (!res.ok) throw new Error(`Check failed (${res.status})`);
    const j = (await res.json()) as {
      done: boolean;
      finished: number;
      processing: number;
      waiting: number;
      queue_position: number;
      wait_time: number;
      faulted?: boolean;
    };
    return j;
  });

export const getGenerationResult = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const res = await fetch(`${BASE}/generate/status/${data.id}`);
    if (!res.ok) throw new Error(`Status failed (${res.status})`);
    const j = (await res.json()) as {
      generations: Array<{ img: string; seed: string; model: string; worker_name: string }>;
    };
    const first = j.generations?.[0];
    if (!first) throw new Error("No image returned");
    return {
      img: first.img,
      seed: first.seed,
      model: first.model,
      worker: first.worker_name,
    };
  });

export const listModels = createServerFn({ method: "GET" }).handler(async () => {
  const res = await fetch(`${BASE}/status/models?type=image`);
  if (!res.ok) return [] as Array<{ name: string; count: number }>;
  const j = (await res.json()) as Array<{ name: string; count: number }>;
  return j
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
    .map((m) => ({ name: m.name, count: m.count }));
});
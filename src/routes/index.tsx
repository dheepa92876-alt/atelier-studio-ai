import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  submitGeneration,
  checkGeneration,
  getGenerationResult,
  listModels,
} from "@/lib/horde.functions";
import { getModelPreset } from "@/lib/model-presets";
import type { ModelPreset } from "@/lib/model-presets";
import { CURATED_PROMPTS, getRandomPrompts } from "@/lib/prompt-inspiration";
import type { CuratedPrompt } from "@/lib/prompt-inspiration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — AI Image Studio" },
      {
        name: "description",
        content:
          "An editorial image studio powered by the AI Horde. Compose a prompt, dial the parameters, generate.",
      },
      { property: "og:title", content: "Atelier — AI Image Studio" },
      {
        property: "og:description",
        content:
          "Compose, refine, generate. Open-source diffusion through the AI Horde.",
      },
    ],
  }),
  component: Index,
});

type HistoryItem = {
  id: string;
  img: string;
  prompt: string;
  negative: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  model: string;
  seed: string;
  createdAt: number;
};

type Status =
  | { phase: "idle" }
  | { phase: "queued"; queue: number; wait: number }
  | { phase: "processing" }
  | { phase: "error"; message: string };

const HISTORY_KEY = "atelier.history.v1";
const DEFAULT_MODEL = "stable_diffusion";

function Index() {
  const submitFn = useServerFn(submitGeneration);
  const checkFn = useServerFn(checkGeneration);
  const resultFn = useServerFn(getGenerationResult);
  const modelsFn = useServerFn(listModels);

  const [prompt, setPrompt] = useState(
    "A hidden waterfall deep inside a lush green forest, sunlight rays passing through trees, cinematic, ultra realistic, peaceful atmosphere",
  );
  const [negative, setNegative] = useState("blurry, low quality, ugly, distorted, extra legs, extra eyes, deformed, cropped, watermark, text, logo, bad anatomy");
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [steps, setSteps] = useState(25);
  const [cfg, setCfg] = useState(7);
  const [model, setModel] = useState(DEFAULT_MODEL);

  const [status, setStatus] = useState<Status>({ phase: "idle" });
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const cancelRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (items: HistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 60)));
    } catch {}
  };

  const { data: models } = useQuery({
    queryKey: ["horde-models"],
    queryFn: () => modelsFn(),
    staleTime: 5 * 60 * 1000,
  });

  const modelOptions = useMemo(() => {
    const list = models ?? [];
    if (!list.find((m) => m.name === model)) {
      return [{ name: model, count: 0 }, ...list];
    }
    return list;
  }, [models, model]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function generate() {
    if (busy) return;
    if (!prompt.trim()) {
      toast.error("Write a prompt first.");
      return;
    }
    setBusy(true);
    cancelRef.current = false;
    setCurrent(null);
    setStatus({ phase: "queued", queue: 0, wait: 0 });

    try {
      const { id } = await submitFn({
        data: {
          prompt,
          negative_prompt: negative,
          width,
          height,
          steps,
          cfg_scale: cfg,
          model,
        },
      });

      while (!cancelRef.current) {
        await sleep(3000);
        const s = await checkFn({ data: { id } });
        if (s.faulted) throw new Error("The worker faulted. Try again.");
        if (s.done) {
          setStatus({ phase: "processing" });
          break;
        }
        if (s.processing > 0) {
          setStatus({ phase: "processing" });
        } else {
          setStatus({
            phase: "queued",
            queue: s.queue_position,
            wait: s.wait_time,
          });
        }
      }
      if (cancelRef.current) {
        setStatus({ phase: "idle" });
        return;
      }

      const r = await resultFn({ data: { id } });
      const item: HistoryItem = {
        id,
        img: r.img,
        prompt,
        negative,
        width,
        height,
        steps,
        cfg,
        model: r.model,
        seed: r.seed,
        createdAt: Date.now(),
      };
      setCurrent(item);
      persist([item, ...history]);
      setStatus({ phase: "idle" });
      toast.success("Image ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setStatus({ phase: "error", message: msg });
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    cancelRef.current = true;
    setBusy(false);
    setStatus({ phase: "idle" });
  }

  function recall(item: HistoryItem) {
    setPrompt(item.prompt);
    setNegative(item.negative);
    setWidth(item.width);
    setHeight(item.height);
    setSteps(item.steps);
    setCfg(item.cfg);
    setModel(item.model);
    setCurrent(item);
  }

  async function download(item: HistoryItem) {
    try {
      const res = await fetch(item.img);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atelier-${item.id.slice(0, 8)}.webp`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(item.img, "_blank");
    }
  }

  return (
    <main className="relative z-10 min-h-screen">
      <Toaster theme="dark" position="bottom-right" />

      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1400px] items-baseline justify-between px-8 py-6">
          <div className="flex items-baseline gap-4">
            <h1 className="font-serif text-3xl italic tracking-tight text-foreground">
              Atelier
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              vol. 01 — image studio
            </span>
          </div>
          <div className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
            powered by the AI Horde
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-px bg-border/60 lg:grid-cols-[380px_1fr]">
        <aside className="bg-background p-8">
          <SectionLabel>I. The Prompt</SectionLabel>
          <div className="mt-4 space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Describe the scene…"
              className="resize-none border-border bg-card font-serif text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Negative
              </Label>
              <Input
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                placeholder="What to avoid"
                className="mt-2 border-border bg-card text-sm"
              />
            </div>
          </div>

          <PromptInspiration
            currentPrompt={prompt}
            onSelect={(p) => {
              setPrompt(p.text);
              if (p.negative) setNegative(p.negative);
            }}
          />

          <Divider />
          <SectionLabel>II. Parameters</SectionLabel>

          <div className="mt-5 space-y-6">
            <ParamSlider label="Width" value={width} min={256} max={1024} step={64} onChange={setWidth} suffix="px" />
            <ParamSlider label="Height" value={height} min={256} max={1024} step={64} onChange={setHeight} suffix="px" />
            <ParamSlider label="Steps" value={steps} min={5} max={50} step={1} onChange={setSteps} />
            <ParamSlider label="CFG Scale" value={cfg} min={1} max={20} step={0.5} onChange={setCfg} />

            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Model
              </Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-2 border-border bg-card font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {modelOptions.map((m) => (
                    <SelectItem key={m.name} value={m.name} className="font-mono text-xs">
                      {m.name}
                      {m.count > 0 && (
                        <span className="ml-2 text-muted-foreground">· {m.count}w</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ModelRecommendation
                model={model}
                onApply={(p) => {
                  setSteps(p.steps);
                  setCfg(p.cfg);
                  setWidth(p.width);
                  setHeight(p.height);
                  toast.success("Applied recommended settings");
                }}
              />
            </div>
          </div>

          <Divider />

          <div className="flex gap-2">
            <Button
              onClick={generate}
              disabled={busy}
              className="h-11 flex-1 rounded-sm bg-primary font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "Working…" : "Generate"}
            </Button>
            {busy && (
              <Button
                onClick={cancel}
                variant="outline"
                className="h-11 rounded-sm border-border bg-transparent font-mono text-[11px] uppercase tracking-[0.2em]"
              >
                Cancel
              </Button>
            )}
          </div>

          <StatusLine status={status} />
        </aside>

        <section className="bg-background p-8">
          <Canvas item={current} busy={busy} status={status} onDownload={download} />

          {history.length > 0 && (
            <>
              <div className="mt-12 flex items-center justify-between">
                <SectionLabel>III. Archive</SectionLabel>
                <button
                  onClick={() => persist([])}
                  className="ml-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => recall(h)}
                    className="group relative aspect-square overflow-hidden border border-border bg-card transition-all hover:border-primary"
                  >
                    <img
                      src={h.img}
                      alt={h.prompt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="line-clamp-2 font-serif text-[11px] italic text-foreground/90">
                        {h.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <footer className="mx-auto max-w-[1400px] px-8 py-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Images are rendered by volunteer workers on the AI Horde network.
      </footer>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function Divider() {
  return <div className="my-8 h-px w-full bg-border" />;
}

function ModelRecommendation({
  model,
  onApply,
}: {
  model: string;
  onApply: (p: ModelPreset) => void;
}) {
  const preset = getModelPreset(model);
  return (
    <div className="mt-3 rounded-sm border border-border/70 bg-card/60 p-3">
      <p className="font-serif text-[12px] italic leading-snug text-muted-foreground">
        {preset.note}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {preset.steps} steps · cfg {preset.cfg} · {preset.width}×{preset.height}
        </span>
        <button
          type="button"
          onClick={() => onApply(preset)}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary transition-colors hover:text-foreground"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-xs text-foreground">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <Slider
        className="mt-3"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.phase === "idle") return null;
  let text = "";
  if (status.phase === "queued")
    text = `In queue · position ${status.queue} · ~${status.wait}s`;
  if (status.phase === "processing") text = "Worker rendering…";
  if (status.phase === "error") text = status.message;

  return (
    <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
      {status.phase !== "error" && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      )}
      <span className={status.phase === "error" ? "text-destructive" : ""}>{text}</span>
    </div>
  );
}

function Canvas({
  item,
  busy,
  status,
  onDownload,
}: {
  item: HistoryItem | null;
  busy: boolean;
  status: Status;
  onDownload: (i: HistoryItem) => void;
}) {
  return (
    <div>
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border border-border bg-card">
        {item ? (
          <img src={item.img} alt={item.prompt} className="h-full w-full object-contain" />
        ) : busy ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full border border-primary/40" />
              <div className="absolute inset-2 rounded-full border border-primary" />
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              {status.phase === "queued" ? "Awaiting a worker…" : "Rendering…"}
            </p>
          </div>
        ) : (
          <div className="px-12 text-center">
            <p className="font-serif text-2xl italic leading-snug text-muted-foreground">
              "A canvas waits.
              <br />
              Compose a prompt to begin."
            </p>
          </div>
        )}
      </div>

      {item && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
            <Meta label="Seed" value={item.seed} />
            <Meta label="Model" value={item.model} />
            <Meta label="Size" value={`${item.width}×${item.height}`} />
            <Meta label="Steps / CFG" value={`${item.steps} · ${item.cfg}`} />
          </dl>
          <Button
            onClick={() => onDownload(item)}
            variant="outline"
            className="h-10 rounded-sm border-border bg-transparent font-mono text-[11px] uppercase tracking-[0.2em] hover:border-primary hover:text-primary"
          >
            Download
          </Button>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="truncate text-foreground">{value}</dd>
    </>
  );
}

function PromptInspiration({
  currentPrompt,
  onSelect,
}: {
  currentPrompt: string;
  onSelect: (p: CuratedPrompt) => void;
}) {
  const [visible, setVisible] = useState<CuratedPrompt[]>([]);

  useEffect(() => {
    setVisible(getRandomPrompts(3, currentPrompt));
  }, [currentPrompt]);

  function shuffle() {
    setVisible(getRandomPrompts(3, currentPrompt));
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          Inspiration
        </span>
        <button
          type="button"
          onClick={shuffle}
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          title="Shuffle prompts"
        >
          Shuffle
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {visible.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(p)}
            className="group w-full rounded-sm border border-border/60 bg-card/40 p-3 text-left transition-all hover:border-primary/60 hover:bg-card"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-primary">
                {p.category}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 font-serif text-[12px] italic leading-snug text-muted-foreground transition-colors group-hover:text-foreground">
              {p.text}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

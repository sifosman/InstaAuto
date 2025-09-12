"use client";
import { useEffect, useMemo, useState, ChangeEvent } from "react";

type GalleryItem = { name: string; url: string };

type PromptResponse = {
  system_prompt: string;
  user_prompt: string;
  merged_prompt: string;
  variables: { image: string; price?: string | null; sale_tag?: string | null; brand_primary: string; brand_accent: string; company: string };
};

export default function ProductPromptPage() {
  const [products, setProducts] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [price, setPrice] = useState("");
  const [saleTag, setSaleTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    void fetchMore(true);
  }, []);

  async function fetchMore(reset = false) {
    try {
      setLoading(true);
      const res = await fetch(`/api/list/product?limit=24&offset=${reset ? 0 : offset}`);
      const data = await res.json();
      const items: GalleryItem[] = data?.items || [];
      if (reset) {
        setProducts(items);
        setOffset(24);
      } else {
        setProducts((prev) => [...prev, ...items]);
        setOffset(offset + 24);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onGenerate() {
    if (!selected) {
      alert("Select a product image first");
      return;
    }
    setGenerating(true);
    try {
      const body = { name: selected.name, price: price || undefined, sale_tag: saleTag || undefined };
      const res = await fetch("/api/prompt/product", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to build prompt");
      setResult(data as PromptResponse);
    } catch (e: any) {
      alert(e?.message || "Failed to build prompt");
    } finally {
      setGenerating(false);
    }
  }

  function onCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard");
    });
  }

  const preview = useMemo(() => {
    if (!result) return "";
    // Provide a readable single block for external pasting
    const tags = (result as any).hashtags as string[] | undefined;
    const hash = tags?.length ? "\n" + tags.map((t) => `#${t}`).join(" ") : "";
    return `${result.merged_prompt}\n${hash}`;
  }, [result]);

  return (
    <main className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Product Post Prompt</h1>
        <a href="/" className="text-blue-700 underline">Back to Dashboard</a>
      </div>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border p-4 bg-white/60 backdrop-blur">
            <h2 className="font-semibold mb-2">Choose product image</h2>
            {loading && products.length === 0 ? (
              <p className="text-sm text-gray-600">Loading products…</p>
            ) : (
              <div className="thumb-grid">
                {products.map((it) => (
                  <button key={it.name} type="button" className={`relative group rounded-md overflow-hidden border ${selected?.name === it.name ? 'ring-2 ring-blue-600' : ''}`} onClick={() => setSelected(it)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.url} alt={it.name} className="thumb" />
                    {selected?.name === it.name ? (
                      <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Selected</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => fetchMore(false)} className="text-xs px-3 py-1 rounded border bg-white/70 hover:bg-white">Load more</button>
            </div>
          </div>

          <div className="rounded-2xl border p-4 bg-white/60 backdrop-blur">
            <h2 className="font-semibold mb-2">Details</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-gray-700">Price (optional)</span>
                <input value={price} onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)} placeholder="e.g. R999" className="mt-1 w-full rounded border p-2" />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Sale Tag (optional)</span>
                <input value={saleTag} onChange={(e: ChangeEvent<HTMLInputElement>) => setSaleTag(e.target.value)} placeholder="e.g. 20% OFF" className="mt-1 w-full rounded border p-2" />
              </label>
            </div>
            <button type="button" onClick={onGenerate} disabled={generating} className="mt-4 px-4 py-2 rounded bg-black text-white disabled:opacity-60">
              {generating ? 'Generating…' : 'Generate Prompt'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-4 bg-white/60 backdrop-blur">
            <h2 className="font-semibold mb-2">Result</h2>
            {result ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1">System Prompt</p>
                  <textarea readOnly value={result.system_prompt} className="w-full h-28 rounded border p-2 font-mono text-xs" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">User Prompt</p>
                  <textarea readOnly value={result.user_prompt} className="w-full h-36 rounded border p-2 font-mono text-xs" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Merged (copy this into your LLM)</p>
                  <textarea readOnly value={result.merged_prompt} className="w-full h-48 rounded border p-2 font-mono text-xs" />
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="px-3 py-1 rounded border bg-white hover:bg-gray-50 text-sm" onClick={() => onCopy(result.merged_prompt)}>Copy merged</button>
                    <button type="button" className="px-3 py-1 rounded border bg-white hover:bg-gray-50 text-sm" onClick={() => onCopy(preview)}>Copy merged + hashtags</button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No prompt yet. Select an image and click Generate.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";
import { useState } from 'react';

type Row = {
  date: string;
  template: string;
  headline: string;
  subtext?: string;
  cta?: string;
  hashtags?: string;
  style_variant?: string;
  image_strategy: 'ai' | 'img2img' | 'videoai';
  asset_url?: string;
  asset_tags?: string;
  notes?: string;
};

const TEMPLATES = ["tip","how_to","myth_vs_fact","checklist","case_study","stat","tool_highlight","trend","mini_tutorial"] as const;

export default function CreatePostPage() {
  const [row, setRow] = useState<Row>({
    date: new Date().toISOString().slice(0,10),
    template: 'tip',
    headline: '',
    subtext: '',
    cta: '',
    hashtags: '',
    style_variant: 'minimalist high-contrast',
    image_strategy: 'ai',
    asset_url: '',
    asset_tags: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Insert failed');
      setMsg('Inserted row with id: ' + (data.row?.id || 'ok'));
    } catch (err: any) {
      setMsg(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Test IG Post</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Date</label>
            <input type="date" className="border p-2 rounded w-full" value={row.date} onChange={e=>setRow({...row, date:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Template</label>
            <select className="border p-2 rounded w-full" value={row.template} onChange={e=>setRow({...row, template:e.target.value})}>
              {TEMPLATES.map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm">Headline</label>
          <input className="border p-2 rounded w-full" value={row.headline} onChange={e=>setRow({...row, headline:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm">Subtext</label>
          <textarea className="border p-2 rounded w-full" value={row.subtext} onChange={e=>setRow({...row, subtext:e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">CTA</label>
            <input className="border p-2 rounded w-full" value={row.cta} onChange={e=>setRow({...row, cta:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Style variant</label>
            <input className="border p-2 rounded w-full" value={row.style_variant} onChange={e=>setRow({...row, style_variant:e.target.value})} />
          </div>
        </div>
        <div>
          <label className="block text-sm">Hashtags (space-separated)</label>
          <input className="border p-2 rounded w-full" value={row.hashtags} onChange={e=>setRow({...row, hashtags:e.target.value})} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm">Strategy</label>
            <select className="border p-2 rounded w-full" value={row.image_strategy} onChange={e=>setRow({...row, image_strategy:e.target.value as any})}>
              <option value="ai">ai</option>
              <option value="img2img">img2img</option>
              <option value="videoai">videoai</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm">Asset URL (for img2img/videoai)</label>
            <input className="border p-2 rounded w-full" value={row.asset_url} onChange={e=>setRow({...row, asset_url:e.target.value})} placeholder="https://..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Asset tags (comma-separated)</label>
            <input className="border p-2 rounded w-full" value={row.asset_tags} onChange={e=>setRow({...row, asset_tags:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Notes (used as prompt for videoai)</label>
            <textarea className="border p-2 rounded w-full" value={row.notes} onChange={e=>setRow({...row, notes:e.target.value})} />
          </div>
        </div>
        <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading?'Saving...':'Insert Row'}</button>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
      </form>
    </main>
  );
}

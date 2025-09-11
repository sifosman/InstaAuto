"use client";
import { useState } from 'react';

export default function UploadPage() {
  const [tab, setTab] = useState<'assets' | 'videos'>('assets');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUrl('');
    if (!file) { setError('Choose a file'); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const endpoint = tab === 'assets' ? '/api/upload/asset' : '/api/upload/video';
      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUrl(data.public_url);
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Upload Assets</h1>

      <div className="flex gap-2">
        <button className={`px-3 py-2 rounded ${tab==='assets'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('assets')}>Images (img2img)</button>
        <button className={`px-3 py-2 rounded ${tab==='videos'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setTab('videos')}>Video Images (I2V)</button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading? 'Uploading...' : 'Upload'}</button>
      </form>

      {error && <p className="text-red-600">{error}</p>}
      {url && (
        <div className="break-all">
          <p className="text-sm text-gray-600">Public URL</p>
          <a className="text-blue-700 underline" href={url} target="_blank" rel="noreferrer">{url}</a>
        </div>
      )}
    </main>
  );
}

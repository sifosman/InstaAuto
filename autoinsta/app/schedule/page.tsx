"use client";
import { useEffect, useState } from 'react';

type S = { enabled: boolean; hours: number[] };

export default function SchedulePage() {
  const [state, setState] = useState<S>({ enabled: true, hours: [8] });
  const [mode, setMode] = useState<'once'|'twice'>('once');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/schedule');
        const data = await res.json();
        const profile = data?.profile || {};
        const enabled = profile.enabled ?? true;
        const hours = Array.isArray(profile.schedule_hours) && profile.schedule_hours.length > 0 ? profile.schedule_hours : [8];
        setState({ enabled, hours });
        setMode(hours.length > 1 ? 'twice' : 'once');
      } catch {}
      setLoading(false);
    })();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const hours = mode === 'once' ? [state.hours[0] ?? 8] : [state.hours[0] ?? 8, state.hours[1] ?? 16];
    const res = await fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: state.enabled, hours })
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg(data.error || 'Save failed'); return; }
    setMsg('Saved & n8n schedule updated');
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Daily Workflow Schedule</h1>
      {loading ? <p>Loading...</p> : (
        <form onSubmit={onSave} className="space-y-4">
          <div className="flex items-center gap-2">
            <input id="enabled" type="checkbox" checked={state.enabled} onChange={e=>setState({...state, enabled:e.target.checked})} />
            <label htmlFor="enabled">Enable daily workflow</label>
          </div>
          <div className="flex gap-2">
            <button type="button" className={`px-3 py-2 rounded ${mode==='once'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setMode('once')}>Once</button>
            <button type="button" className={`px-3 py-2 rounded ${mode==='twice'?'bg-blue-600 text-white':'bg-gray-200'}`} onClick={()=>setMode('twice')}>Twice</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Hour 1 (0-23)</label>
              <input type="number" min={0} max={23} className="border p-2 rounded w-full" value={state.hours[0] ?? 8} onChange={e=>{
                const v = Number(e.target.value); const hours=[...state.hours]; hours[0]=v; setState({...state, hours});
              }} />
            </div>
            {mode==='twice' && (
              <div>
                <label className="block text-sm">Hour 2 (0-23)</label>
                <input type="number" min={0} max={23} className="border p-2 rounded w-full" value={state.hours[1] ?? 16} onChange={e=>{
                  const v = Number(e.target.value); const hours=[...state.hours]; hours[1]=v; setState({...state, hours});
                }} />
              </div>
            )}
          </div>
          <button disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving? 'Saving...' : 'Save'}</button>
          {msg && <p className="text-sm text-gray-700">{msg}</p>}
        </form>
      )}
    </main>
  );
}

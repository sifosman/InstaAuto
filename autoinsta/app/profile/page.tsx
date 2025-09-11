"use client";
import { useEffect, useState } from 'react';

type Profile = {
  company_name?: string;
  brand_primary_hex?: string;
  brand_accent_hex?: string;
  logo_url?: string;
  timezone?: string;
  schedule_hours?: number[];
  enabled?: boolean;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [ok, setOk] = useState<string>('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data?.profile) setProfile(data.profile);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setOk('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setOk('Saved');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Business Profile</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Company name</label>
            <input className="border p-2 rounded w-full" value={profile.company_name||''} onChange={e=>setProfile({...profile, company_name:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Brand primary hex</label>
              <input type="color" className="border p-2 rounded w-full h-10" value={profile.brand_primary_hex||'#0A84FF'} onChange={e=>setProfile({...profile, brand_primary_hex:e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium">Brand accent hex</label>
              <input type="color" className="border p-2 rounded w-full h-10" value={profile.brand_accent_hex||'#00C2A8'} onChange={e=>setProfile({...profile, brand_accent_hex:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Logo URL</label>
            <input className="border p-2 rounded w-full" value={profile.logo_url||''} onChange={e=>setProfile({...profile, logo_url:e.target.value})} placeholder="https://.../logo.png" />
          </div>
          <div>
            <label className="block text-sm font-medium">Timezone</label>
            <input className="border p-2 rounded w-full" value={profile.timezone||'Africa/Johannesburg'} onChange={e=>setProfile({...profile, timezone:e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <input id="enabled" type="checkbox" checked={!!profile.enabled} onChange={e=>setProfile({...profile, enabled:e.target.checked})} />
            <label htmlFor="enabled">Enable daily workflow</label>
          </div>
          <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving? 'Saving...' : 'Save'}</button>
          {error && <p className="text-red-600">{error}</p>}
          {ok && <p className="text-green-700">{ok}</p>}
        </form>
      )}
    </main>
  );
}

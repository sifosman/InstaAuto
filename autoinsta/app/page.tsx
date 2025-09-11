"use client";
import { useEffect, useState } from 'react';

type Schedule = { enabled: boolean; hours: number[] };
type Profile = { company_name?: string; logo_url?: string; brand_primary_hex?: string; brand_accent_hex?: string };
type Post = { id: number; date?: string | null; headline?: string | null; image_strategy?: string | null; status?: string | null };

export default function Home() {
  const [sched, setSched] = useState<Schedule>({ enabled: true, hours: [8] });
  const [profile, setProfile] = useState<Profile>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const primary = profile.brand_primary_hex || '#0A84FF';
  const accent = profile.brand_accent_hex || '#00C2A8';

  useEffect(() => {
    (async () => {
      try {
        const [schedRes, profRes, postsRes] = await Promise.all([
          fetch('/api/schedule'),
          fetch('/api/profile'),
          fetch('/api/posts/recent'),
        ]);
        const schedData = await schedRes.json();
        const profData = await profRes.json();
        const postsData = await postsRes.json();
        const p = profData?.profile || {};
        const s = schedData?.profile || {};
        setProfile(p);
        setSched({ enabled: !!s.enabled, hours: s.schedule_hours || [8] });
        setPosts(postsData?.posts || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch('/api/run-now', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Run failed');
      alert('Triggered daily workflow');
    } catch (e: any) {
      alert(e.message || 'Run failed');
    } finally { setRunning(false); }
  }

  return (
    <main className="space-y-6">
      {/* Hero / Greeting */}
      <section className="rounded-2xl p-6 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(90deg, ${primary}33, ${accent}33)` }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome{profile.company_name ? `, ${profile.company_name}` : ''}</h1>
            <p className="text-sm text-gray-700">Your Instagram automation overview</p>
          </div>
          {profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.logo_url} alt="logo" className="h-10 w-auto rounded" />
          ) : null}
        </div>
      </section>

      {/* Actions row */}
      <section className="grid md:grid-cols-4 gap-4">
        <DashCard title="Upload" href="/upload" gradient={`${primary}, ${accent}`}>
          Upload images for img2img or I2V videos.
        </DashCard>
        <DashCard title="Create Post" href="/posts" gradient={`${accent}, ${primary}`}>
          Insert a test row in ig_posts.
        </DashCard>
        <DashCard title="Profile" href="/profile" gradient={`${primary}, #6EE7F9`}>
          Company name, colors, logo.
        </DashCard>
        <DashCard title="Schedule" href="/schedule" gradient={`#A78BFA, ${accent}`}>
          Enable/disable and set hours.
        </DashCard>
      </section>

      {/* Main grid: left content + right sidebar */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* Left: Recent posts + status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border p-4 bg-white/60 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent posts</h2>
              <a className="text-sm text-blue-700 underline" href="/posts">Add new</a>
            </div>
            {loading ? (
              <p className="text-sm text-gray-600">Loading...</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-gray-600">No posts yet</p>
            ) : (
              <ul className="divide-y">
                {posts.map((p) => (
                  <li key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.headline || 'Untitled'}</p>
                      <p className="text-xs text-gray-600">{p.date || 'No date'} • {p.image_strategy || 'ai'} • {p.status || 'todo'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100">#{p.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Schedule & controls */}
        <div className="space-y-6">
          <div className="rounded-2xl border p-4 bg-white/60 backdrop-blur">
            <h2 className="font-semibold mb-2">Schedule</h2>
            {loading ? (
              <p className="text-sm text-gray-600">Loading...</p>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>Status: <span className={sched.enabled? 'text-green-700':'text-red-700'}>{sched.enabled? 'Enabled':'Paused'}</span></p>
                <p>Hours: {Array.isArray(sched.hours)? sched.hours.join(', ') : '—'}</p>
                <a className="text-blue-700 underline" href="/schedule">Manage schedule →</a>
              </div>
            )}
            <button onClick={runNow} disabled={running} className="mt-4 px-4 py-2 rounded bg-black text-white disabled:opacity-60">{running? 'Triggering...' : 'Run now'}</button>
          </div>

          <div className="rounded-2xl border p-4 bg-white/60 backdrop-blur">
            <h2 className="font-semibold mb-2">Profile</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Company: {profile.company_name || '—'}</p>
              <p>Brand: <span style={{ background: primary }} className="inline-block w-3 h-3 rounded align-middle mr-1" /> <span style={{ background: accent }} className="inline-block w-3 h-3 rounded align-middle mr-1" />
                <span className="align-middle">{primary} / {accent}</span>
              </p>
              <a className="text-blue-700 underline" href="/profile">Edit profile →</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashCard({ title, href, children, gradient }: { title: string; href: string; children: React.ReactNode; gradient: string }) {
  return (
    <a href={href} className="group block rounded-2xl p-4 border bg-white/60 backdrop-blur hover:shadow-lg transition relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(135deg, ${gradient})` }} />
      <div className="relative">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-700">{children}</p>
      </div>
    </a>
  );
}

"use client";
import { useEffect, useState, ReactNode, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

type Schedule = { enabled: boolean; hours: number[] };
type Profile = {
  company_name?: string;
  logo_url?: string;
  brand_primary_hex?: string;
  brand_accent_hex?: string;
  industry?: string;
  target_audience?: string;
  brand_voice?: string;
  products_services?: string;
  website?: string;
  location?: string;
  goals?: string;
  hashtags?: string[] | string;
  content_pillars?: string[] | string;
  // New fields for enhanced user input system
  content_brief?: string;
  key_topics?: string[] | string;
  tone_style?: string;
};
type Post = { id: number; date?: string | null; headline?: string | null; image_strategy?: string | null; status?: string | null };
type GalleryItem = { name: string; url: string };
type FancyCardProps = { href: string; title: string; text: string; a: string; b: string; linkColor: string; cta: string };

export default function Home() {
  const router = useRouter();
  const [sched, setSched] = useState<Schedule>({ enabled: true, hours: [8] });
  const [profile, setProfile] = useState<Profile>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string>("");
  const primary = profile.brand_primary_hex || '#0A84FF';
  const accent = profile.brand_accent_hex || '#00C2A8';

  // Galleries
  const [refImages, setRefImages] = useState<GalleryItem[]>([]);
  const [reelImages, setReelImages] = useState<GalleryItem[]>([]);
  const [productImages, setProductImages] = useState<GalleryItem[]>([]);
  const [refOffset, setRefOffset] = useState(24);
  const [reelOffset, setReelOffset] = useState(24);
  const [prodOffset, setProdOffset] = useState(24);

  // Auth guard: redirect unauthenticated users to /login
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace('/login');
      }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const [schedRes, profRes, postsRes, refRes, reelRes, prodRes] = await Promise.all([
          fetch('/api/schedule'),
          fetch('/api/profile'),
          fetch('/api/posts/recent'),
          fetch('/api/list/asset?limit=24'),
          fetch('/api/list/video?limit=24'),
          fetch('/api/list/product?limit=100'),
        ]);
        const schedData = await schedRes.json();
        const profData = await profRes.json();
        const postsData = await postsRes.json();
        const p = profData?.profile || {};
        const s = schedData?.profile || {};
        setProfile(p);
        setSched({ enabled: !!s.enabled, hours: s.schedule_hours || [8] });
        setPosts(postsData?.posts || []);
        setRefImages((await refRes.json())?.items || []);
        setReelImages((await reelRes.json())?.items || []);
        setProductImages((await prodRes.json())?.items || []);
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

  async function saveProfileInline(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setProfile(data.profile || profile);
      setProfileMsg('Saved');
    } catch (err: any) {
      setProfileMsg(err?.message || 'Error saving');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f5f0] to-[#ede8e0]">
      {/* Navigation Header */}
      <header className="nav-header">
        <div className="nav-logo">InstaAuto</div>
        <nav className="nav-menu">
          <div className="nav-item active">Dashboard</div>
          <div className="nav-item">Analytics</div>
          <div className="nav-item">Content</div>
          <div className="nav-item">Schedule</div>
          <div className="nav-item">Settings</div>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${sched.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">{sched.enabled ? 'Active' : 'Inactive'}</span>
          </div>
          {profile.logo_url && (
            <img src={profile.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
          )}
        </div>
      </header>

      <main className="p-8 space-y-8">
        {/* Welcome Section */}
        <section className="animate-fade-in-up section-spacing">
          <h1 className="heading-xl mb-3">
            Welcome in{profile.company_name ? `, ${profile.company_name}` : ''}
          </h1>
          <p className="body-lg">Manage your Instagram automation and content strategy</p>
        </section>

        {/* Enhanced Profile Section */}
        <section className="profile-section animate-fade-in-up section-spacing">
          <div className="profile-header">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="Company Logo" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-large bg-gradient-to-br from-[var(--accent-yellow)] to-[var(--accent-orange)] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.company_name ? profile.company_name.charAt(0).toUpperCase() : 'C'}
                </span>
              </div>
            )}
            <div className="profile-details">
              <h2>{profile.company_name || 'Your Company'}</h2>
              <p className="subtitle">Instagram Automation Dashboard</p>
              <div className="profile-status">
                <div className={`w-2 h-2 rounded-full ${sched.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{sched.enabled ? 'Automation Active' : 'Automation Paused'}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-metrics">
            <div className="metric-item">
              <h3 className="metric-value">{posts.length}</h3>
              <p className="metric-label">Total Posts</p>
            </div>
            <div className="metric-item">
              <h3 className="metric-value">{refImages.length + reelImages.length + productImages.length}</h3>
              <p className="metric-label">Assets</p>
            </div>
            <div className="metric-item">
              <h3 className="metric-value">{sched.hours?.length || 0}</h3>
              <p className="metric-label">Daily Posts</p>
            </div>
            <div className="metric-item">
              <h3 className="metric-value">24/7</h3>
              <p className="metric-label">Monitoring</p>
            </div>
          </div>
        </section>

        {/* Quick Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up section-spacing">
          <div className="stats-card card-hover">
            <h3 className="stats-number">{posts.length}</h3>
            <p className="stats-label">Posts</p>
          </div>
          <div className="stats-card card-hover">
            <h3 className="stats-number">{refImages.length}</h3>
            <p className="stats-label">References</p>
          </div>
          <div className="stats-card card-hover">
            <h3 className="stats-number">{reelImages.length}</h3>
            <p className="stats-label">Reels</p>
          </div>
          <div className="stats-card card-hover">
            <h3 className="stats-number">{productImages.length}</h3>
            <p className="stats-label">Products</p>
          </div>
        </section>

      {/* Actions row (Fancy Cards) */}
      <section className="grid md:grid-cols-3 gap-6 section-spacing">
        <FancyCard
          href="/profile"
          title="Business Profile"
          text="Configure company name, brand colors and logo."
          a={primary}
          b="#6EE7F9"
          linkColor="#0aa56a"
          cta="Open profile"
        />
        <FancyCard
          href="/schedule"
          title="Automation Schedule"
          text="Enable or disable the daily workflow and set posting hours."
          a="#A78BFA"
          b={accent}
          linkColor="#5b21b6"
          cta="Manage schedule"
        />
        <FancyCard
          href="/prompt/product"
          title="Product Post Prompt"
          text="Generate an AI-ready prompt for IG posts using your product images, price and sale tags."
          a="#34d399"
          b="#f59e0b"
          linkColor="#065f46"
          cta="Open prompt builder"
        />
      </section>

      {/* Content Management */}
      <section className="section-spacing">
        <h2 className="heading-md mb-6">Content Management</h2>
        <div className="grid lg:grid-cols-3 gap-6">
        <UploadPanel
          title="Reference Images"
          colorClass="uploader-cyan"
          hint="Images to use as references for posts (ig_assets)"
          endpoint="/api/upload/asset"
          items={refImages}
          onUploaded={(item)=> setRefImages([item, ...refImages].slice(0, 500))}
          onDelete={async (name)=>{
            const res = await fetch('/api/delete/asset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            if (res.ok) setRefImages(refImages.filter((i: GalleryItem)=>i.name!==name));
          }}
          onLoadMore={async ()=>{
            const res = await fetch(`/api/list/asset?limit=24&offset=${refOffset}`);
            const data = await res.json();
            setRefImages([...refImages, ...(data.items||[])]);
            setRefOffset(refOffset+24);
          }}
        />
        <UploadPanel
          title="Reels Stills (I2V)"
          colorClass="uploader-pink"
          hint="Images to convert to reels (ig_videos)"
          endpoint="/api/upload/video"
          items={reelImages}
          onUploaded={(item)=> setReelImages([item, ...reelImages].slice(0, 500))}
          onDelete={async (name)=>{
            const res = await fetch('/api/delete/video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            if (res.ok) setReelImages(reelImages.filter((i: GalleryItem)=>i.name!==name));
          }}
          onLoadMore={async ()=>{
            const res = await fetch(`/api/list/video?limit=24&offset=${reelOffset}`);
            const data = await res.json();
            setReelImages([...reelImages, ...(data.items||[])]);
            setReelOffset(reelOffset+24);
          }}
        />
        <UploadPanel
          title="Product Images"
          colorClass="uploader-amber"
          hint="Product images (ig_products)"
          endpoint="/api/upload/product"
          items={productImages}
          onUploaded={(item)=> setProductImages([item, ...productImages].slice(0, 500))}
          onDelete={async (name)=>{
            const res = await fetch('/api/delete/product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            if (res.ok) setProductImages(productImages.filter(i=>i.name!==name));
          }}
          onLoadMore={async ()=>{
            const res = await fetch(`/api/list/product?limit=100&offset=${prodOffset}`);
            const data = await res.json();
            setProductImages([...productImages, ...(data.items||[])]);
            setProdOffset(prodOffset+100);
          }}
          showLoadMore={false}
        />
        </div>
      </section>

      {/* Dashboard Overview */}
      <section className="section-spacing">
        <h2 className="heading-md mb-6">Dashboard Overview</h2>
        <div className="grid lg:grid-cols-3 gap-6">
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
                {posts.map((p: Post) => (
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
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-blue-700">Edit business profile</summary>
              <form onSubmit={saveProfileInline} className="mt-3 space-y-3 text-sm">
                <div>
                  <label className="block font-medium">Company name</label>
                  <input className="border p-2 rounded w-full" value={profile.company_name || ''} onChange={(e)=> setProfile({ ...profile, company_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block font-medium">Industry</label>
                    <input className="border p-2 rounded w-full" value={profile.industry || ''} onChange={(e)=> setProfile({ ...profile, industry: e.target.value })} />
                  </div>
                  <div>
                    <label className="block font-medium">Target audience</label>
                    <input className="border p-2 rounded w-full" value={profile.target_audience || ''} onChange={(e)=> setProfile({ ...profile, target_audience: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block font-medium">Brand voice</label>
                  <input className="border p-2 rounded w-full" placeholder="e.g., friendly, expert, energetic" value={profile.brand_voice || ''} onChange={(e)=> setProfile({ ...profile, brand_voice: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium">Tone & style</label>
                  <input className="border p-2 rounded w-full" placeholder="e.g., professional, friendly, humorous" value={profile.tone_style || ''} onChange={(e)=> setProfile({ ...profile, tone_style: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium">Products / Services</label>
                  <textarea className="border p-2 rounded w-full" rows={2} value={profile.products_services || ''} onChange={(e)=> setProfile({ ...profile, products_services: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium">Content brief</label>
                  <textarea className="border p-2 rounded w-full" rows={4} placeholder={"Tell us about your business and what you'd like to post about"} value={profile.content_brief || ''} onChange={(e)=> setProfile({ ...profile, content_brief: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block font-medium">Website</label>
                    <input className="border p-2 rounded w-full" value={profile.website || ''} onChange={(e)=> setProfile({ ...profile, website: e.target.value })} />
                  </div>
                  <div>
                    <label className="block font-medium">Location</label>
                    <input className="border p-2 rounded w-full" value={profile.location || ''} onChange={(e)=> setProfile({ ...profile, location: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block font-medium">Business goals</label>
                  <textarea className="border p-2 rounded w-full" rows={2} value={profile.goals || ''} onChange={(e)=> setProfile({ ...profile, goals: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block font-medium">Hashtags (comma-separated)</label>
                    <input className="border p-2 rounded w-full" value={Array.isArray(profile.hashtags)? profile.hashtags.join(', ') : (profile.hashtags || '')} onChange={(e)=> setProfile({ ...profile, hashtags: e.target.value })} />
                  </div>
                  <div>
                    <label className="block font-medium">Content pillars (comma-separated)</label>
                    <input className="border p-2 rounded w-full" value={Array.isArray(profile.content_pillars)? profile.content_pillars.join(', ') : (profile.content_pillars || '')} onChange={(e)=> setProfile({ ...profile, content_pillars: e.target.value })} />
                  </div>
                  <div>
                    <label className="block font-medium">Key topics (comma-separated)</label>
                    <input className="border p-2 rounded w-full" placeholder="e.g., productivity, tech tips, industry insights" value={Array.isArray(profile.key_topics)? profile.key_topics.join(', ') : (profile.key_topics || '')} onChange={(e)=> setProfile({ ...profile, key_topics: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium">Brand primary</label>
                    <input type="color" className="border p-1 rounded w-full h-10" value={primary} onChange={(e)=> setProfile({ ...profile, brand_primary_hex: e.target.value })} />
                  </div>
                  <div>
                    <label className="block font-medium">Brand accent</label>
                    <input type="color" className="border p-1 rounded w-full h-10" value={accent} onChange={(e)=> setProfile({ ...profile, brand_accent_hex: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block font-medium">Logo URL</label>
                  <input className="border p-2 rounded w-full" placeholder="https://.../logo.png" value={profile.logo_url || ''} onChange={(e)=> setProfile({ ...profile, logo_url: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={savingProfile} className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-60">
                    {savingProfile ? 'Saving…' : 'Save'}
                  </button>
                  {profileMsg && <span className="text-xs text-gray-700">{profileMsg}</span>}
                </div>
              </form>
            </details>
          </div>
        </div>
        </div>
      </section>
    </main>
    </div>
  );
}

function FancyCard({ href, title, text, a, b, linkColor, cta }: FancyCardProps) {
  return (
    <a href={href} className="fancy-parent block">
      <div className="fancy-card" style={{ ['--fc-a' as any]: a, ['--fc-b' as any]: b, ['--fc-link' as any]: linkColor }}>
        <div className="fancy-logo">
          <span className="fancy-circle c1" />
          <span className="fancy-circle c2" />
          <span className="fancy-circle c3" />
          <span className="fancy-circle c4" />
        </div>
        <div className="fancy-glass" />
        <div className="fancy-content">
          <span className="fancy-title">{title}</span>
          <span className="fancy-text">{text}</span>
        </div>
        <div className="fancy-bottom">
          <span className="fancy-link">{cta}
            <svg className="inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </span>
        </div>
      </div>
    </a>
  );
}

function DashCard({ title, href, children, gradient }: { title: string; href: string; children: ReactNode; gradient: string }) {
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

function UploadPanel({ title, colorClass, hint, endpoint, items, onUploaded, onDelete, onLoadMore, showLoadMore = true }:
  { title: string; colorClass: string; hint: string; endpoint: string; items: GalleryItem[]; onUploaded: (item: GalleryItem)=>void; onDelete: (name: string)=>Promise<void> | void; onLoadMore: ()=>Promise<void> | void; showLoadMore?: boolean }) {
  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(endpoint, { method: 'POST', body: form });
    const data = await res.json();
    if (res.ok && data.public_url) {
      onUploaded({ name: data.name || file.name, url: data.public_url });
    } else {
      alert(data.error || 'Upload failed');
    }
    // reset
    e.currentTarget.value = '';
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-gray-600">{hint}</p>
        </div>
        <div className={`input-div ${colorClass}`}>
          <input className="input" name="file" type="file" accept="image/*" onChange={handleChange} />
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" strokeLinejoin="round" strokeLinecap="round" viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="currentColor" className="icon"><polyline points="16 16 12 12 8 16"></polyline><line y2="21" x2="12" y1="12" x1="12"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 16 12 12 8 16"></polyline></svg>
        </div>
      </div>
      <div className="thumb-grid">
        {items.map((it) => (
          <div key={it.name} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt="thumb" className="thumb" />
            <button
              type="button"
              onClick={()=> onDelete(it.name)}
              className="opacity-0 group-hover:opacity-100 transition absolute top-1 right-1 bg-white/80 hover:bg-red-600 hover:text-white text-xs px-2 py-0.5 rounded"
              aria-label="Delete"
            >×</button>
          </div>
        ))}
      </div>
      {showLoadMore && (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={()=> onLoadMore()} className="text-xs px-3 py-1 rounded border bg-white/70 hover:bg-white">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

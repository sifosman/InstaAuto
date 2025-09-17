import { NextRequest, NextResponse } from 'next/server';
import { getWorkflow, patchWorkflow } from '@/lib/n8n';
import { createClient } from '@supabase/supabase-js';

function serverClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  // Optionally return saved schedule from profile and n8n active flag
  const supabase = serverClient();
  const { data } = await supabase.from('business_profile').select('*').limit(1).maybeSingle();
  try {
    const wf = await getWorkflow(process.env.N8N_BASE_URL!, process.env.N8N_API_KEY!, process.env.N8N_DAILY_WORKFLOW_ID!);
    return NextResponse.json({ profile: data || null, workflow: { id: wf.id, active: wf.active } });
  } catch {
    return NextResponse.json({ profile: data || null });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const enabled: boolean = !!body.enabled;
  const hours: number[] = Array.isArray(body.hours) ? body.hours.map((n: any) => Number(n)) : [Number(body.hour ?? 8)];

  // Patch n8n workflow
  const wf = await getWorkflow(process.env.N8N_BASE_URL!, process.env.N8N_API_KEY!, process.env.N8N_DAILY_WORKFLOW_ID!);
  const nodes = wf.nodes.map((n: any) => {
    if (n.type === 'n8n-nodes-base.scheduleTrigger') {
      return {
        ...n,
        parameters: {
          ...n.parameters,
          rule: { interval: hours.map((h) => ({ triggerAtHour: h })) },
        },
      };
    }
    return n;
  });
  const patched = await patchWorkflow(
    process.env.N8N_BASE_URL!,
    process.env.N8N_API_KEY!,
    process.env.N8N_DAILY_WORKFLOW_ID!,
    { name: wf.name, active: enabled, connections: wf.connections, nodes, settings: wf.settings }
  );

  // Save to profile for UI
  const supabase = serverClient();
  const { data, error } = await supabase
    .from('business_profile')
    .upsert({ schedule_hours: hours, enabled, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select('*')
    .limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, profile: data?.[0] || null, workflow: { id: patched.id, active: patched.active } });
}

export async function getWorkflow(N8N_BASE_URL: string, API_KEY: string, workflowId: string) {
  const res = await fetch(`${N8N_BASE_URL}/rest/workflows/${workflowId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`n8n get workflow failed: ${res.status}`);
  return res.json();
}

export async function patchWorkflow(
  N8N_BASE_URL: string,
  API_KEY: string,
  workflowId: string,
  patch: any
) {
  const res = await fetch(`${N8N_BASE_URL}/rest/workflows/${workflowId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`n8n patch failed: ${res.status} ${txt}`);
  }
  return res.json();
}

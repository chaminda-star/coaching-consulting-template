// Server-only helper: streams a Responses call through the AI Gateway and returns parsed JSON.
export async function gatewayJson<T>(opts: {
  system: string;
  user: string;
  name: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      text: { format: { type: "json_schema", name: opts.name, strict: true, schema: opts.schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, body);
    if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits have run out. Top up in Settings → Plans & credits.");
    if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
    throw new Error("The AI service is unavailable right now.");
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let refused = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data) as { type?: string; delta?: string };
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        if (ev.type === "response.refusal.delta") refused = true;
        if (ev.type === "response.failed" || ev.type === "error") throw new Error("The AI request failed.");
      } catch (e) {
        if (e instanceof Error && e.message === "The AI request failed.") throw e;
      }
    }
  }
  if (refused || !text) throw new Error("The AI could not answer this request.");
  return JSON.parse(text) as T;
}

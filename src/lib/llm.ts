export async function callLLM({
  messages,
  model,
  apiKey,
  baseUrl,
}: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model: string;
  apiKey?: string;
  baseUrl?: string;
}): Promise<ReadableStream> {
  const url = `${baseUrl || "https://api.openai.com"}/v1/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey ? `Bearer ${apiKey}` : "",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  return response.body;
}

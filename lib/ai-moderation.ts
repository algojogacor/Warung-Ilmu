interface ModerationResult {
  isSafe: boolean
  reason?: string
}

const PROMPT = (content: string) =>
  `Apakah teks berikut mengandung kata kasar, ujaran kebencian, SARA, atau konten tidak pantas untuk platform edukasi pelajar SMA Indonesia? Jawab HANYA dengan JSON tanpa penjelasan lain: {"isSafe": true, "reason": ""} atau {"isSafe": false, "reason": "alasan singkat"}.\n\nTeks: ${content.slice(0, 800)}`

function getGroqKeys(): string[] {
  return Array.from({ length: 10 }, (_, i) =>
    process.env[`GROQ_API_KEY_${i + 1}`]
  ).filter(Boolean) as string[]
}

async function callOpenAICompatible(
  baseURL: string,
  apiKey: string,
  model: string,
  content: string
): Promise<string | null> {
  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a strict JSON responding moderation AI.' },
          { role: 'user', content: PROMPT(content) }
        ],
        max_tokens: 100,
      }),
      // Use standard AbortSignal
      signal: AbortSignal.timeout(5000), // 5 seconds timeout
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

export async function checkContentModeration(
  content: string
): Promise<ModerationResult> {
  // 1. Coba semua Groq keys (fastest, highest limits)
  const groqKeys = getGroqKeys()
  for (const key of groqKeys) {
    const result = await callOpenAICompatible(
      'https://api.groq.com/openai/v1',
      key,
      'llama-3.1-8b-instant',
      content
    )
    if (result) {
      try { return JSON.parse(result.trim()) } catch {}
    }
  }

  // 2. Fallback ke Cohere (20 RPM, 1K/bulan)
  if (process.env.COHERE_API_KEY) {
    const result = await callOpenAICompatible(
      'https://api.cohere.com/compatibility/v1',
      process.env.COHERE_API_KEY,
      'command-r',
      content
    )
    if (result) {
      try { return JSON.parse(result.trim()) } catch {}
    }
  }

  // 3. Fallback ke GitHub Models (10-15 RPM, 50-150 RPD)
  if (process.env.GITHUB_MODELS_TOKEN) {
    const result = await callOpenAICompatible(
      'https://models.github.ai/inference',
      process.env.GITHUB_MODELS_TOKEN,
      'meta/Llama-3.1-8B-Instruct',
      content
    )
    if (result) {
      try { return JSON.parse(result.trim()) } catch {}
    }
  }

  // 4. Semua provider gagal — jangan blokir user
  return { isSafe: true }
}
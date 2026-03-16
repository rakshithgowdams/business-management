import { getOpenRouterKey, OPENROUTER_URL, logUsage, COST_PER_CALL, type TaskType } from './models';

const MODEL_ID = 'google/gemini-2.5-flash';
const VISION_MODEL = 'google/gemini-2.5-flash';

export async function callVisionModel(base64Data: string, mediaType: string, textPrompt: string, taskType: TaskType = 'receipt_scan'): Promise<string> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('No OpenRouter API key found. Add your key in Settings.');

  const startTime = performance.now();

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://mydesignnexus.com',
      'X-Title': 'MyFinance OS',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a receipt and invoice OCR extraction assistant. You ONLY output valid JSON. No markdown, no explanation, no extra text. Just the JSON object.',
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Data}` } },
            { type: 'text', text: textPrompt },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    const errText = await res.text();
    let message = `Vision API error ${res.status}`;
    try {
      const errJson = JSON.parse(errText);
      message = errJson.error?.message || errJson.error || message;
    } catch {
      // use default message
    }
    logUsage({
      timestamp: new Date().toISOString(),
      taskType,
      modelKey: 'geminiFlash',
      modelName: 'Gemini 2.5 Flash',
      tokensUsed: 0,
      estimatedCost: COST_PER_CALL[VISION_MODEL] || 0.1,
      durationMs,
      status: 'error',
    });
    throw new Error(message);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  const tokensUsed = json.usage?.total_tokens || 0;

  logUsage({
    timestamp: new Date().toISOString(),
    taskType,
    modelKey: 'geminiFlash',
    modelName: 'Gemini 2.5 Flash',
    tokensUsed,
    estimatedCost: COST_PER_CALL[VISION_MODEL] || 0.1,
    durationMs,
    status: content ? 'success' : 'error',
  });

  if (!content) throw new Error('Empty response from vision model');
  return content;
}

export const callClaudeVision = callVisionModel;

export async function callGeminiFlash(prompt: string, taskType: TaskType = 'quick_chat'): Promise<string> {
  const key = getOpenRouterKey();
  if (!key) throw new Error('No OpenRouter API key found. Add your key in Settings.');

  const startTime = performance.now();

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://mydesignnexus.com',
      'X-Title': 'MyFinance OS',
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    const err = await res.text();
    logUsage({
      timestamp: new Date().toISOString(),
      taskType,
      modelKey: 'geminiFlash',
      modelName: 'Gemini 2.5 Flash',
      tokensUsed: 0,
      estimatedCost: COST_PER_CALL[MODEL_ID] || 0.1,
      durationMs,
      status: 'error',
    });
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || '';
  const tokensUsed = json.usage?.total_tokens || 0;

  logUsage({
    timestamp: new Date().toISOString(),
    taskType,
    modelKey: 'geminiFlash',
    modelName: 'Gemini 2.5 Flash',
    tokensUsed,
    estimatedCost: COST_PER_CALL[MODEL_ID] || 0.1,
    durationMs,
    status: 'success',
  });

  return content;
}

export function parseJSON<T>(raw: string): T {
  let text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();

  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    text = text.slice(braceStart, braceEnd + 1);
  }

  text = text
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  return JSON.parse(text);
}

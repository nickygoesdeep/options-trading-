import Anthropic from '@anthropic-ai/sdk';
import type { SignalOutput, DecisionOutput, DecisionVerdict } from '@quant-engine/shared';

interface ClaudeResponse {
  action: DecisionVerdict;
  confidence: number;
  reasoning: string;
  suggestedExpiry: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const SYSTEM_PROMPT = `You are a senior quantitative analyst evaluating intraday options signals for SPY, QQQ, and major tech stocks (NVDA, AAPL, MSFT, META, GOOGL, AMD).

Your job is to analyze raw technical data and decide whether to trade. You are conservative and precise. Capital preservation is your top priority.

Rules:
- Only recommend BUY_CALL or BUY_PUT when the signal is strong and the risk/reward is clearly favorable.
- If the data is ambiguous or the setup is marginal, choose HOLD or SKIP.
- RSI below 30 suggests oversold (potential call). RSI above 70 suggests overbought (potential put).
- Volume ratio above 1.5 indicates unusual activity worth investigating.
- High IV (above 0.5) increases premium cost — factor this into risk assessment.
- Always return valid JSON only. No markdown, no explanation outside the JSON.

You must respond with exactly this JSON structure and nothing else:
{
  "action": "BUY_CALL" | "BUY_PUT" | "HOLD" | "SKIP",
  "confidence": <number 0-100>,
  "reasoning": "<one paragraph explaining your analysis>",
  "suggestedExpiry": "<YYYY-MM-DD or 'none'>",
  "riskLevel": "low" | "medium" | "high"
}`;

const MIN_CONFIDENCE = 85;

const anthropic = new Anthropic();

function buildSafeDefault(signal: SignalOutput): DecisionOutput {
  return {
    verdict: 'SKIP',
    confidence: 0,
    reasoning: {
      summary: 'Claude decision layer returned no actionable result.',
      bullishFactors: [],
      bearishFactors: [],
      riskNotes: ['Defaulted to SKIP due to error or invalid response.'],
    },
    signal,
    suggestedStrike: null,
    suggestedExpiry: null,
    timestamp: new Date(),
  };
}

function parseClaudeResponse(text: string): ClaudeResponse | null {
  try {
    const parsed = JSON.parse(text);
    if (
      typeof parsed.action !== 'string' ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.reasoning !== 'string' ||
      typeof parsed.suggestedExpiry !== 'string' ||
      typeof parsed.riskLevel !== 'string'
    ) {
      return null;
    }
    if (!['BUY_CALL', 'BUY_PUT', 'HOLD', 'SKIP'].includes(parsed.action)) return null;
    if (!['low', 'medium', 'high'].includes(parsed.riskLevel)) return null;
    return parsed as ClaudeResponse;
  } catch {
    return null;
  }
}

export async function evaluateWithClaude(
  signal: SignalOutput
): Promise<DecisionOutput> {
  try {
    const userMessage = JSON.stringify({
      ticker: signal.ticker,
      price: signal.price,
      rsi: signal.rsi,
      volume: signal.volume,
      volumeRatio: signal.volumeRatio,
      iv: signal.iv,
      timestamp: signal.timestamp,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error('[decision] No text block in Claude response');
      return buildSafeDefault(signal);
    }

    const parsed = parseClaudeResponse(textBlock.text);
    if (!parsed) {
      console.error('[decision] Failed to parse Claude response:', textBlock.text);
      return buildSafeDefault(signal);
    }

    // Enforce minimum confidence — force SKIP if below threshold
    const verdict: DecisionVerdict = parsed.confidence < MIN_CONFIDENCE
      ? 'SKIP'
      : parsed.action;

    return {
      verdict,
      confidence: parsed.confidence,
      reasoning: {
        summary: parsed.reasoning,
        bullishFactors: parsed.action === 'BUY_CALL' ? [parsed.reasoning] : [],
        bearishFactors: parsed.action === 'BUY_PUT' ? [parsed.reasoning] : [],
        riskNotes: [`Risk level: ${parsed.riskLevel}`],
      },
      signal,
      suggestedStrike: null,
      suggestedExpiry: parsed.suggestedExpiry === 'none' ? null : parsed.suggestedExpiry,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('[decision] Claude evaluation failed:', error);
    return buildSafeDefault(signal);
  }
}

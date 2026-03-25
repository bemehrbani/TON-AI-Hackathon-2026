import { config } from "../config.js";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the ONTON AI Concierge — a helpful assistant for the ONTON ecosystem on the TON blockchain.

ONTON is a trust and participation layer for the TON ecosystem. Users earn reputation points by attending events, connecting social accounts, participating in games, and contributing to the community. Reputation is tracked via ONTON Points and Soulbound Tokens (SBTs).

Your capabilities:
1. **Reputation Lookup**: Get any wallet's trust score, rank, and activity breakdown
2. **Event Discovery**: Find events by type (online/offline), date, or location
3. **Organizer Trust**: Check if an event organizer is legitimate based on their history
4. **SBT Verification**: Verify someone's Soulbound Token holdings (proof of attendance)
5. **Leaderboard**: Show top contributors in the ecosystem
6. **Ecosystem Stats**: Provide overview of the ONTON ecosystem

When users ask questions, determine what they want and respond helpfully. If you need a wallet address, ask for it politely.

Activity types that earn points:
- free_online_event (1 pt), free_offline_event (10 pts), paid_online_event (10 pts), paid_offline_event (20 pts)
- Social connections: x_connect, github_connect, linked_in_connect, google_connect
- Community: join_onton, join_onton_affiliate, start_bot, open_mini_app
- Engagement: x_view_post, x_retweet, tg_join_channel, tg_join_group

Respond concisely and use emojis sparingly. Format data clearly.`;

/**
 * Classify user intent and generate a response using DeepSeek.
 */
export async function classifyAndRespond(
  userMessage: string,
  context?: string
): Promise<{ intent: string; response: string; needsWallet: boolean; needsAction: string | null }> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({
      role: "system",
      content: `Here is the latest data context from the ONTON API:\n${context}`,
    });
  }

  messages.push({
    role: "user",
    content: userMessage,
  });

  try {
    const response = await fetch(`${config.deepseekBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: {
          type: "json_object",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return {
        intent: "error",
        response: "I'm having trouble processing your request right now. Please try again.",
        needsWallet: false,
        needsAction: null,
      };
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content ?? "{}";

    try {
      const parsed = JSON.parse(content) as {
        intent?: string;
        response?: string;
        needs_wallet?: boolean;
        action?: string | null;
      };
      return {
        intent: parsed.intent ?? "general",
        response: parsed.response ?? "I'm not sure how to help with that. Try asking about events, reputation scores, or the leaderboard!",
        needsWallet: parsed.needs_wallet ?? false,
        needsAction: parsed.action ?? null,
      };
    } catch {
      // If JSON parsing fails, use raw content as response
      return {
        intent: "general",
        response: content,
        needsWallet: false,
        needsAction: null,
      };
    }
  } catch (error) {
    console.error("LLM error:", error);
    return {
      intent: "error",
      response: "Connection issue with the AI service. Please try again in a moment.",
      needsWallet: false,
      needsAction: null,
    };
  }
}

/**
 * Simple intent detection without LLM (fallback / quick match).
 */
export function quickIntentDetect(message: string): string | null {
  const lower = message.toLowerCase();

  if (lower.includes("reputation") || lower.includes("score") || lower.includes("my rep") || lower.includes("trust")) {
    return "reputation";
  }
  if (lower.includes("event") || lower.includes("meetup") || lower.includes("conference")) {
    return "events";
  }
  if (lower.includes("leaderboard") || lower.includes("top") || lower.includes("ranking")) {
    return "leaderboard";
  }
  if (lower.includes("sbt") || lower.includes("badge") || lower.includes("nft") || lower.includes("token")) {
    return "verify_sbt";
  }
  if (lower.includes("organizer") || lower.includes("legit") || lower.includes("trust")) {
    return "organizer_check";
  }
  if (lower.includes("stats") || lower.includes("ecosystem") || lower.includes("overview")) {
    return "ecosystem";
  }
  if (lower.includes("help") || lower.includes("what can you")) {
    return "help";
  }

  return null;
}

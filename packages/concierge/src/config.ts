import "dotenv/config";

export const config = {
  botToken: process.env.BOT_TOKEN ?? "",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3100",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
} as const;

if (!config.botToken) {
  throw new Error("BOT_TOKEN environment variable is required");
}

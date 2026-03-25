import { config } from "../config.js";

/**
 * Lightweight API client for the Concierge bot.
 * Calls the ONTON Reputation API endpoints directly.
 */
class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
  }

  private async get<T>(path: string): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`);
      if (!response.ok) return null;
      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`API call failed: ${path}`, error);
      return null;
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) return null;
      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`API call failed: ${path}`, error);
      return null;
    }
  }

  async getReputation(wallet: string) {
    return this.get<Record<string, unknown>>(`/v1/reputation/${wallet}`);
  }

  async getReputationHistory(wallet: string) {
    return this.get<Record<string, unknown>>(`/v1/reputation/${wallet}/history?limit=10`);
  }

  async getEvents(params?: { type?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.type) query.set("type", params.type);
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return this.get<Record<string, unknown>>(`/v1/events${qs ? `?${qs}` : ""}`);
  }

  async getEventStats(uuid: string) {
    return this.get<Record<string, unknown>>(`/v1/events/${uuid}/stats`);
  }

  async getLeaderboard(limit = 10) {
    return this.get<Record<string, unknown>>(`/v1/leaderboard?limit=${limit}`);
  }

  async verifySBT(wallet: string) {
    return this.get<Record<string, unknown>>(`/v1/verify/sbt/${wallet}`);
  }

  async agentQuery(query: string) {
    return this.post<Record<string, unknown>>("/v1/agents/query", { query });
  }
}

export const apiClient = new APIClient();

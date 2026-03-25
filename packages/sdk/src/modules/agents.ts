import { OntonClient } from "../client.js";
import type { AgentQueryResponse } from "../types.js";

export class AgentsModule {
  constructor(private client: OntonClient) {}

  /**
   * Send a natural language query to the ONTON API.
   * Useful for AI agents that want to query ONTON data conversationally.
   */
  async query(text: string): Promise<AgentQueryResponse> {
    return this.client.post<AgentQueryResponse>("/v1/agents/query", { query: text });
  }
}

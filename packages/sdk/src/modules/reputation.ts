import { OntonClient } from "../client.js";
import type { ReputationResponse, HistoryResponse } from "../types.js";

export class ReputationModule {
  constructor(private client: OntonClient) {}

  /**
   * Get the full reputation profile for a TON wallet address.
   * Returns trust score, rank, activity breakdown, and latest snapshot.
   */
  async get(wallet: string): Promise<ReputationResponse> {
    return this.client.get<ReputationResponse>(`/v1/reputation/${wallet}`);
  }

  /**
   * Get the score history (individual score events) for a wallet.
   */
  async history(wallet: string, options?: { limit?: number; offset?: number }): Promise<HistoryResponse> {
    return this.client.get<HistoryResponse>(`/v1/reputation/${wallet}/history`, {
      limit: options?.limit,
      offset: options?.offset,
    });
  }
}

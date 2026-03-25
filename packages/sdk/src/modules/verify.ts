import { OntonClient } from "../client.js";
import type { SBTResponse, AttendanceResponse } from "../types.js";

export class VerifyModule {
  constructor(private client: OntonClient) {}

  /**
   * Verify SBT (Soulbound Token) holdings for a wallet.
   */
  async sbt(wallet: string): Promise<SBTResponse> {
    return this.client.get<SBTResponse>(`/v1/verify/sbt/${wallet}`);
  }

  /**
   * Verify if a wallet attended a specific event.
   */
  async attendance(wallet: string, eventUuid: string): Promise<AttendanceResponse> {
    return this.client.get<AttendanceResponse>(`/v1/verify/attendance/${wallet}/${eventUuid}`);
  }
}

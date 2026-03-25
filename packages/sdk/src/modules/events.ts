import { OntonClient } from "../client.js";
import type { EventsResponse, EventStatsResponse, EventsQueryOptions } from "../types.js";

export class EventsModule {
  constructor(private client: OntonClient) {}

  /**
   * List public events with optional filters.
   */
  async list(options?: EventsQueryOptions): Promise<EventsResponse> {
    return this.client.get<EventsResponse>("/v1/events", {
      type: options?.type,
      from: options?.from,
      to: options?.to,
      hub: options?.hub,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Get detailed statistics for a specific event.
   */
  async stats(eventUuid: string): Promise<EventStatsResponse> {
    return this.client.get<EventStatsResponse>(`/v1/events/${eventUuid}/stats`);
  }
}

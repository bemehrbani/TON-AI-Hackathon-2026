/**
 * @onton/agent-sdk
 *
 * TypeScript SDK for the ONTON Reputation API.
 * Provides typed access to ONTON's on-chain reputation data, event information,
 * and verification services for AI agents and developers building on TON.
 *
 * @example
 * ```typescript
 * import { OntonSDK } from '@onton/agent-sdk';
 *
 * const onton = new OntonSDK({ baseUrl: 'https://api.onton.live' });
 *
 * // Get user reputation
 * const rep = await onton.reputation.get('EQB...');
 * console.log(rep.totalScore, rep.rank);
 *
 * // List upcoming events
 * const events = await onton.events.list({ type: 'in_person', limit: 5 });
 *
 * // Get agent tool definitions for LangChain/OpenAI
 * const tools = onton.getAgentTools();
 * ```
 */
import { OntonClient } from "./client.js";
import { ReputationModule } from "./modules/reputation.js";
import { EventsModule } from "./modules/events.js";
import { VerifyModule } from "./modules/verify.js";
import { AgentsModule } from "./modules/agents.js";
import { getAgentToolDefinitions } from "./tools/langchain.js";
import type { AgentToolDefinition } from "./types.js";

export interface OntonSDKConfig {
  /** Base URL of the ONTON Reputation API */
  baseUrl: string;
}

export class OntonSDK {
  private client: OntonClient;

  /** Reputation score lookups and history */
  public readonly reputation: ReputationModule;

  /** Event discovery and statistics */
  public readonly events: EventsModule;

  /** SBT and attendance verification */
  public readonly verify: VerifyModule;

  /** Natural language queries */
  public readonly agents: AgentsModule;

  constructor(config: OntonSDKConfig) {
    this.client = new OntonClient(config.baseUrl);
    this.reputation = new ReputationModule(this.client);
    this.events = new EventsModule(this.client);
    this.verify = new VerifyModule(this.client);
    this.agents = new AgentsModule(this.client);
  }

  /**
   * Get pre-built tool definitions for LangChain, OpenAI function calling,
   * or any other AI agent framework.
   *
   * @returns Array of tool definitions with name, description, and parameter schemas
   */
  getAgentTools(): AgentToolDefinition[] {
    return getAgentToolDefinitions();
  }
}

// Re-export everything
export { OntonClient, OntonAPIError } from "./client.js";
export { ReputationModule } from "./modules/reputation.js";
export { EventsModule } from "./modules/events.js";
export { VerifyModule } from "./modules/verify.js";
export { AgentsModule } from "./modules/agents.js";
export { getAgentToolDefinitions } from "./tools/langchain.js";
export type * from "./types.js";

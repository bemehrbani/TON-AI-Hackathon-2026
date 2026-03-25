import type { AgentToolDefinition } from "../types.js";

/**
 * Pre-built tool definitions compatible with LangChain and OpenAI function calling.
 * AI agents can use these directly to interact with the ONTON Reputation API.
 */
export function getAgentToolDefinitions(): AgentToolDefinition[] {
  return [
    {
      name: "onton_get_reputation",
      description:
        "Get the reputation profile for a TON wallet address. Returns trust score, rank, activity breakdown (events attended, hosted, social connections), and membership duration in the ONTON ecosystem.",
      parameters: {
        type: "object",
        properties: {
          wallet_address: {
            type: "string",
            description: "The TON wallet address to look up (e.g., EQB...)",
          },
        },
        required: ["wallet_address"],
      },
    },
    {
      name: "onton_get_reputation_history",
      description:
        "Get the score history for a TON wallet — individual point-earning events over time. Useful for understanding a user's engagement trajectory.",
      parameters: {
        type: "object",
        properties: {
          wallet_address: {
            type: "string",
            description: "The TON wallet address to look up",
          },
          limit: {
            type: "string",
            description: "Max number of results (default 50, max 100)",
          },
        },
        required: ["wallet_address"],
      },
    },
    {
      name: "onton_list_events",
      description:
        "List public events in the ONTON ecosystem. Can filter by type (online/in_person), date range, and society hub. Returns event details with organizer reputation scores.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Event type filter",
            enum: ["online", "in_person"],
          },
          from: {
            type: "string",
            description: "Start date filter as unix timestamp",
          },
          to: {
            type: "string",
            description: "End date filter as unix timestamp",
          },
          hub: {
            type: "string",
            description: "Society hub name filter",
          },
          limit: {
            type: "string",
            description: "Max results (default 20, max 50)",
          },
        },
        required: [],
      },
    },
    {
      name: "onton_get_event_stats",
      description:
        "Get detailed attendance statistics for a specific event — registration count, check-in rate, capacity utilization, and approval breakdown.",
      parameters: {
        type: "object",
        properties: {
          event_uuid: {
            type: "string",
            description: "The UUID of the event to get stats for",
          },
        },
        required: ["event_uuid"],
      },
    },
    {
      name: "onton_get_leaderboard",
      description:
        "Get the top-ranked users in the ONTON ecosystem by reputation score. Also returns ecosystem-wide statistics (total users, total points distributed, average score).",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "string",
            description: "Number of top users to return (default 20, max 100)",
          },
        },
        required: [],
      },
    },
    {
      name: "onton_verify_sbt",
      description:
        "Verify Soulbound Token (SBT) holdings for a wallet. Returns all events where the user earned SBTs through verified attendance, with breakdown by event type.",
      parameters: {
        type: "object",
        properties: {
          wallet_address: {
            type: "string",
            description: "The TON wallet address to verify SBTs for",
          },
        },
        required: ["wallet_address"],
      },
    },
    {
      name: "onton_verify_attendance",
      description:
        "Verify if a specific wallet attended a specific event. Returns verification status, registration status, and timestamp.",
      parameters: {
        type: "object",
        properties: {
          wallet_address: {
            type: "string",
            description: "The TON wallet address to check",
          },
          event_uuid: {
            type: "string",
            description: "The UUID of the event to verify attendance for",
          },
        },
        required: ["wallet_address", "event_uuid"],
      },
    },
    {
      name: "onton_agent_query",
      description:
        "Send a natural language query about the ONTON ecosystem. Supports questions like 'top 10 most active users', 'upcoming events', 'offline events', 'ecosystem stats'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Natural language query about the ONTON ecosystem",
          },
        },
        required: ["query"],
      },
    },
  ];
}

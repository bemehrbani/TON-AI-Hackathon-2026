// ─── Response Types ──────────────────────────────────────────────

export interface ReputationResponse {
  wallet: string;
  totalScore: number;
  rank: number;
  totalUsers: number;
  role: string;
  isPremium: boolean;
  eventsParticipated: number;
  eventsHosted: number;
  memberSince: string;
  activities: Record<string, { points: number; count: number }>;
  latestSnapshot: {
    totalScore: number;
    freeOnlineEvent: number;
    freeOfflineEvent: number;
    paidOnlineEvent: number;
    paidOfflineEvent: number;
    claimStatus: string;
    snapshotDate: string;
  } | null;
}

export interface HistoryItem {
  activityType: string;
  points: number;
  itemType: string | null;
  itemId: number | null;
  date: string;
}

export interface HistoryResponse {
  wallet: string;
  history: HistoryItem[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface EventItem {
  uuid: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  startDate: number;
  endDate: number;
  timezone: string | null;
  location: string | null;
  type: string;
  isPaid: boolean;
  capacity: number | null;
  hub: string | null;
  hasSBT: boolean;
  registrants: number;
  checkedIn: number;
  organizer: {
    wallet: string | null;
    eventsHosted: number;
    reputationScore: number;
    name: string | null;
  } | null;
  createdAt: string;
}

export interface EventsResponse {
  events: EventItem[];
  pagination: PaginationInfo;
}

export interface EventStatsResponse {
  uuid: string;
  title: string;
  type: string;
  isPaid: boolean;
  capacity: number | null;
  hasSBT: boolean;
  startDate: number;
  endDate: number;
  stats: {
    totalRegistrants: number;
    pending: number;
    approved: number;
    checkedIn: number;
    rejected: number;
    checkInRate: number;
    capacityUtilization: number | null;
  };
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string | null;
  totalScore: number;
  eventsParticipated: number;
  eventsHosted: number;
  isPremium: boolean;
  role: string;
  memberSince: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  ecosystem: {
    totalUsers: number;
    usersWithWallet: number;
    totalPointsDistributed: number;
    averageScore: number;
  };
}

export interface SBTHolding {
  eventUuid: string;
  eventTitle: string;
  eventType: string;
  isPaid: boolean;
  eventDate: number | null;
  sbtCollectionAddress: string | null;
  hub: string | null;
  checkedInAt: string;
  verified: boolean;
}

export interface SBTResponse {
  wallet: string;
  totalSBTs: number;
  offlineSBTs: number;
  onlineSBTs: number;
  paidSBTs: number;
  holdings: SBTHolding[];
}

export interface AttendanceResponse {
  verified: boolean;
  status?: string;
  reason?: string;
  registeredAt?: string;
  wallet: string;
  eventUuid: string;
}

export interface AgentQueryResponse {
  query: string;
  intent: string;
  data?: unknown;
  count?: number;
  message?: string;
  supportedQueries?: string[];
}

export interface EventsQueryOptions {
  type?: "online" | "in_person";
  from?: number;
  to?: number;
  hub?: string;
  limit?: number;
  offset?: number;
}

// ─── Agent Tool Definition Types ─────────────────────────────────

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

declare module "../../modules/negotiation-v2/engines/negotiation.engine.js" {
  export interface NegotiationSessionState {
    probeCount: number;
    firstProbeLatencyMs: number | null;
    interestSummaryText: string | null;
    walkAway: boolean;
    round: number;
    trustSeries: number[];
    trust: number;
    jointValueScore: number;
    batnaRevealed: boolean;
    creativeTrade: boolean;
    unilateralConcedeRound1: boolean;
    zeroSumOnly: boolean;
    firstMove: string | null;
    offers: unknown[];
    concessions: unknown[];
    status: string;
    completedAtMs: number;
    startedAtMs: number;
  }

  export function createInitialState(
    sessionId: string,
    userId: string
  ): NegotiationSessionState;

  export function scoreNegotiationV2(state: NegotiationSessionState): {
    composite: number;
    dimensionScores: Record<string, number>;
  };
}

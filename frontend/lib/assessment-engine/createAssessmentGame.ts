import type { EngineType } from "./types";
import type { AssessmentItemProgress } from "./types";

export type CreateAssessmentGameOptions = {
  container: HTMLElement;
  moduleId: string;
  engineType: EngineType;
  sessionId: string;
  onAdaptiveChange?: (state: Record<string, unknown>) => void;
  onComplete?: (session: unknown) => void;
  onItemChange?: (progress: AssessmentItemProgress) => void;
  onReady?: () => void;
};

export type AssessmentEngineInstance = {
  next: () => void;
  previous: () => void;
  submit: () => void;
  destroy: () => void;
};

export async function createAssessmentGame(
  options: CreateAssessmentGameOptions
): Promise<AssessmentEngineInstance> {
  switch (options.engineType) {
    case "likert": {
      const { createLikertEngine } = await import("./engines/likert");
      return createLikertEngine({
        container: options.container,
        moduleId: options.moduleId,
        sessionId: options.sessionId,
        onAdaptiveChange: options.onAdaptiveChange,
        onComplete: options.onComplete,
        onItemChange: options.onItemChange,
        onReady: options.onReady
      });
    }
    case "branching": {
      const { createBranchingEngine } = await import("./engines/branching");
      return createBranchingEngine({
        container: options.container,
        moduleId: options.moduleId,
        sessionId: options.sessionId,
        onAdaptiveChange: options.onAdaptiveChange,
        onComplete: options.onComplete,
        onReady: options.onReady
      });
    }
    case "tracing": {
      const { createTracingEngine } = await import("./engines/tracing/TracingEngine");
      return createTracingEngine({
        container: options.container,
        moduleId: options.moduleId,
        sessionId: options.sessionId,
        onComplete: options.onComplete as (summary: Record<string, unknown>) => void,
        onReady: options.onReady
      });
    }
    case "reaction_time": {
      const { createReactionTimeEngine } = await import("./engines/reaction_time/ReactionTimeEngine");
      return createReactionTimeEngine({
        container: options.container,
        moduleId: options.moduleId,
        sessionId: options.sessionId,
        onComplete: options.onComplete as (summary: Record<string, unknown>) => void,
        onReady: options.onReady
      });
    }
    default:
      throw new Error(`Engine "${options.engineType}" is not implemented yet.`);
  }
}

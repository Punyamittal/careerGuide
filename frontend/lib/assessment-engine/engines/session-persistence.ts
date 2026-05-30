import type { PersistedSession } from "../configs/module-config.types";
import { BranchingSessionPersistence } from "./branching/SessionPersistence";
import { SessionPersistence as LikertSessionPersistence } from "./likert/SessionPersistence";

/** Load persisted assessment session for any engine type. */
export function loadPersistedSession(moduleId: string): PersistedSession | null {
  return BranchingSessionPersistence.load(moduleId) ?? LikertSessionPersistence.load(moduleId);
}

export function clearPersistedSession(moduleId: string) {
  BranchingSessionPersistence.clear(moduleId);
  LikertSessionPersistence.clear(moduleId);
}

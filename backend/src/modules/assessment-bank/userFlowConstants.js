import { join } from "path";
import { ARCHIVE_ROOT } from "./constants.js";

/** Official MBS user-flow orchestration specs (phases → blocks → item_ids). */
export const USER_FLOW_SPECS = {
  user1: {
    key: "user1",
    userFlow: "user-1",
    label: "User 1 — Early Learner",
    grade: "Class 5",
    file: "Archive 2/User_Flows/MBS_UserFlow_User_1.json",
    bankKey: "user1"
  },
  user2: {
    key: "user2",
    userFlow: "user-2",
    label: "User 2 — Middle Learner",
    grade: "Class 8",
    file: "Archive 2/User_Flows/MBS_UserFlow_User_2.json",
    bankKey: "user2"
  },
  user3: {
    key: "user3",
    userFlow: "user-3",
    label: "User 3 — Stream Selector",
    grade: "Classes 9-10",
    file: "Archive 2/User_Flows/MBS_UserFlow_User_3.json",
    bankKey: "user3"
  },
  user4: {
    key: "user4",
    userFlow: "user-4",
    label: "User 4 — Career Explorer",
    grade: "Classes 11-12",
    file: "Archive 2/User_Flows/MBS_UserFlow_User_4.json",
    bankKey: "user4"
  },
  user5: {
    key: "user5",
    userFlow: "user-5",
    label: "User 5 — Undergraduate",
    grade: "Undergraduate",
    file: "Archive 2/User_Flows/MBS_UserFlow_User_5.json",
    bankKey: "user5"
  },
  user6: {
    key: "user6",
    userFlow: "user-6",
    label: "User 6 — Fresher / Intern",
    grade: "Entry-level workforce / interns",
    /** Extended spec incl. ecosystem + clarification routing */
    file: "MBS_UserFlow_User_6.json",
    bankKey: "user6"
  }
};

export const USER_FLOW_INDEX_FILE = "Archive 2/User_Flows/_INDEX.json";

/** @param {string} raw */
export function normalizeUserFlowKey(raw) {
  const s = String(raw).trim().toLowerCase();
  if (USER_FLOW_SPECS[s]) return s;
  const dashed = s.replace(/^user-/, "user");
  if (USER_FLOW_SPECS[dashed]) return dashed;
  const num = s.match(/user[- ]?(\d)/)?.[1];
  if (num) return `user${num}`;
  return s;
}

export function flowBlockModuleId(userFlowKey, phaseIndex, blockIndex) {
  const key = normalizeUserFlowKey(userFlowKey);
  return `UF-${key}-p${phaseIndex}-b${blockIndex}`;
}

export function parseFlowBlockModuleId(moduleId) {
  const m = String(moduleId).match(/^UF-(user\d)-p(\d+)-b(\d+)$/i);
  if (!m) return null;
  return {
    userFlowKey: m[1].toLowerCase(),
    phaseIndex: Number(m[2]),
    blockIndex: Number(m[3])
  };
}

export function resolveUserFlowSpecPath(spec) {
  return join(ARCHIVE_ROOT, spec.file);
}

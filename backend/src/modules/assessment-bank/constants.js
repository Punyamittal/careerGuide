import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const BANK_VERSION = "mbs-archive-v1.0.0";

export const ARCHIVE_ROOT =
  process.env.CLARIFICATION_ASSETS_DIR?.trim() ||
  join(__dirname, "../../../exports/archive");

/** @type {Record<string, { file: string; userFlow: string; label: string }>} */
export const USER_FLOW_BANKS = {
  user1: {
    file: "Archive 2/Question_Banks/MBS_QBank_User_1.json",
    userFlow: "user-1",
    label: "User 1 — Early Learner"
  },
  user2: {
    file: "Archive 2/Question_Banks/MBS_QBank_User_2.json",
    userFlow: "user-2",
    label: "User 2 — Middle Learner"
  },
  user3: {
    file: "Archive 2/Question_Banks/MBS_QBank_User_3.json",
    userFlow: "user-3",
    label: "User 3 — Stream Selector"
  },
  user4: {
    file: "Archive 2/Question_Banks/MBS_QBank_User_4.json",
    userFlow: "user-4",
    label: "User 4 — Career Explorer"
  },
  user5: {
    file: "Archive 2/Question_Banks/MBS_QBank_User_5.json",
    userFlow: "user-5",
    label: "User 5 — Undergraduate"
  },
  user6: {
    file: "Archive 2/MBS_QBank_User_6.json",
    userFlow: "user-6",
    label: "User 6 — Fresher / Intern (primary + ecosystem)"
  }
};

export const ECOSYSTEM_BANK_FILE = "MBS_Ecosystem2026_ItemBank.json";

/** Runtime-generated engines — no static archive item bank. */
export const PROCEDURAL_MODULE_IDS = new Set(["T4", "T5", "M20"]);

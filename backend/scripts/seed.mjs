import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { PROFILE_VECTOR_KEYS, QUESTION_CATEGORIES } from "../src/constants/assessment.js";
import { assessmentKeysForCode } from "../src/constants/assessmentPlans.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../../frontend/data");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const bigFiveBank = JSON.parse(readFileSync(join(dataDir, "psychometric-v2-big-five.json"), "utf8"));
const riasecBank = JSON.parse(readFileSync(join(dataDir, "psychometric-v2-riasec.json"), "utf8"));

const fullVector = (partial) => {
  const o = {};
  for (const k of PROFILE_VECTOR_KEYS) {
    o[k] = typeof partial[k] === "number" ? partial[k] : 0.5;
  }
  return o;
};

const aptitudeQuestions = [
  {
    externalCode: "APT_L_1",
    category: QUESTION_CATEGORIES.APTITUDE_LOGICAL,
    stem: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
    order: 1,
    options: [
      { key: "A", text: "Yes", isCorrect: true },
      { key: "B", text: "No", isCorrect: false },
      { key: "C", text: "Cannot be determined", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_L_2",
    category: QUESTION_CATEGORIES.APTITUDE_LOGICAL,
    stem: "Which number completes the series: 2, 6, 12, 20, ?",
    order: 2,
    options: [
      { key: "A", text: "28", isCorrect: false },
      { key: "B", text: "30", isCorrect: true },
      { key: "C", text: "32", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_L_3",
    category: QUESTION_CATEGORIES.APTITUDE_LOGICAL,
    stem: "All roses are flowers. Some flowers wilt within a day. Can we be sure every rose wilts within a day?",
    order: 3,
    options: [
      { key: "A", text: "Yes, definitely", isCorrect: false },
      { key: "B", text: "No, not from this information", isCorrect: true },
      { key: "C", text: "Only on hot days", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_L_4",
    category: QUESTION_CATEGORIES.APTITUDE_LOGICAL,
    stem: "Which number completes the pattern: 3, 9, 27, 81, ?",
    order: 4,
    options: [
      { key: "A", text: "162", isCorrect: false },
      { key: "B", text: "243", isCorrect: true },
      { key: "C", text: "324", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_N_1",
    category: QUESTION_CATEGORIES.APTITUDE_NUMERICAL,
    stem: "A laptop costs ₹40,000 after a 20% discount. What was the original price (₹)?",
    order: 1,
    options: [
      { key: "A", text: "48,000", isCorrect: false },
      { key: "B", text: "50,000", isCorrect: true },
      { key: "C", text: "52,000", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_N_2",
    category: QUESTION_CATEGORIES.APTITUDE_NUMERICAL,
    stem: "If 3 machines make 90 parts in 2 hours, how many parts do 2 machines make in 4 hours at the same rate?",
    order: 2,
    options: [
      { key: "A", text: "80", isCorrect: false },
      { key: "B", text: "120", isCorrect: true },
      { key: "C", text: "160", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_N_3",
    category: QUESTION_CATEGORIES.APTITUDE_NUMERICAL,
    stem: "A book costs ₹250 after a 10% discount. What was the marked price before the discount (₹)?",
    order: 3,
    options: [
      { key: "A", text: "Approximately 256", isCorrect: false },
      { key: "B", text: "Approximately 278", isCorrect: true },
      { key: "C", text: "275 exactly", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_N_4",
    category: QUESTION_CATEGORIES.APTITUDE_NUMERICAL,
    stem: "A bus covers 360 km in 4.5 hours at constant speed. What is its average speed (km/h)?",
    order: 4,
    options: [
      { key: "A", text: "72", isCorrect: false },
      { key: "B", text: "80", isCorrect: true },
      { key: "C", text: "90", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_V_1",
    category: QUESTION_CATEGORIES.APTITUDE_VERBAL,
    stem: "Choose the word closest in meaning to “prudent”.",
    order: 1,
    options: [
      { key: "A", text: "Reckless", isCorrect: false },
      { key: "B", text: "Cautious", isCorrect: true },
      { key: "C", text: "Verbose", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_V_2",
    category: QUESTION_CATEGORIES.APTITUDE_VERBAL,
    stem: "Complete the sentence: “Her argument sounded ______—plausible at first but not backed by facts.”",
    order: 2,
    options: [
      { key: "A", text: "specious", isCorrect: true },
      { key: "B", text: "meticulous", isCorrect: false },
      { key: "C", text: "pragmatic", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_V_3",
    category: QUESTION_CATEGORIES.APTITUDE_VERBAL,
    stem: "Book : read :: song : ______",
    order: 3,
    options: [
      { key: "A", text: "compose", isCorrect: false },
      { key: "B", text: "listen (to)", isCorrect: true },
      { key: "C", text: "dance", isCorrect: false }
    ]
  },
  {
    externalCode: "APT_V_4",
    category: QUESTION_CATEGORIES.APTITUDE_VERBAL,
    stem: "In the sentence “The team made incremental progress each week,” incremental means:",
    order: 4,
    options: [
      { key: "A", text: "Sudden and large", isCorrect: false },
      { key: "B", text: "Gradual, step by step", isCorrect: true },
      { key: "C", text: "Random and uneven", isCorrect: false }
    ]
  }
];

const bigFiveQuestions = bigFiveBank.map((row, i) => ({
  externalCode: row.code,
  category: QUESTION_CATEGORIES.BIG_FIVE,
  stem: row.stem,
  bigFiveKey: row.bigFiveKey,
  likertReverse: row.reverse,
  useLikert: true,
  order: i + 1,
  options: []
}));

const riasecQuestions = riasecBank.map((row, i) => ({
  externalCode: row.code,
  category: QUESTION_CATEGORIES.RIASEC,
  stem: row.stem,
  riasecKey: row.riasecKey,
  useLikert: true,
  order: i + 1,
  options: [],
  flowRules: row.flowRules && Object.keys(row.flowRules).length ? row.flowRules : {}
}));

const motivationAndWriting = [
  {
    externalCode: "MOT_01",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "A project lands with little guidance. You usually:",
    order: 1,
    options: [
      {
        key: "A",
        text: "Draft a milestone plan and dependency map before execution",
        weights: { data: 2, things: 1 },
        traitWeights: { C: 0.8, O: -0.2 }
      },
      {
        key: "B",
        text: "Build a small prototype first and shape the plan from what you learn",
        weights: { ideas: 2, things: 1 },
        traitWeights: { O: 0.8, C: -0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_02",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "In team meetings you more often:",
    order: 2,
    options: [
      {
        key: "A",
        text: "Synthesize viewpoints and draw quieter members in",
        weights: { people: 2 },
        traitWeights: { A: 0.7, E: 0.3 }
      },
      {
        key: "B",
        text: "Push to lock a decision so execution can begin",
        weights: { data: 1, things: 1 },
        traitWeights: { C: 0.4, E: 0.4 }
      }
    ]
  },
  {
    externalCode: "MOT_03",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "For a hard task, your first move is usually:",
    order: 3,
    options: [
      {
        key: "A",
        text: "Work through it solo for a while before asking for help",
        weights: { ideas: 1, data: 1 },
        traitWeights: { E: -0.6, C: 0.3 }
      },
      {
        key: "B",
        text: "Pair with someone early to troubleshoot together",
        weights: { people: 2 },
        traitWeights: { E: 0.7, A: 0.3 }
      }
    ]
  },
  {
    externalCode: "MOT_04",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "With extra time before deadline, you tend to:",
    order: 4,
    options: [
      {
        key: "A",
        text: "Harden quality and cover edge cases",
        weights: { data: 2 },
        traitWeights: { C: 0.9 }
      },
      {
        key: "B",
        text: "Add one ambitious enhancement that could increase impact",
        weights: { ideas: 2 },
        traitWeights: { O: 0.8, C: 0.1 }
      }
    ]
  },
  {
    externalCode: "MOT_05",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "When feedback is mixed, you usually:",
    order: 5,
    options: [
      {
        key: "A",
        text: "Run quick checks against data before changing direction",
        weights: { data: 2 },
        traitWeights: { C: 0.6, N: -0.2 }
      },
      {
        key: "B",
        text: "Prioritize whichever path improves user or stakeholder trust faster",
        weights: { people: 2 },
        traitWeights: { A: 0.6, E: 0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_06",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "At events, your default mode is:",
    order: 6,
    options: [
      {
        key: "A",
        text: "A few deeper conversations",
        weights: { people: 1, ideas: 1 },
        traitWeights: { E: -0.5, A: 0.2 }
      },
      {
        key: "B",
        text: "Many shorter conversations across groups",
        weights: { people: 2 },
        traitWeights: { E: 0.8 }
      }
    ]
  },
  {
    externalCode: "MOT_07",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "When goals are unclear, you usually:",
    order: 7,
    options: [
      {
        key: "A",
        text: "Ask for explicit criteria and boundaries first",
        weights: { data: 2 },
        traitWeights: { C: 0.7, O: -0.2 }
      },
      {
        key: "B",
        text: "Advance with best assumptions and adjust from feedback",
        weights: { ideas: 2 },
        traitWeights: { O: 0.7, N: -0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_08",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "A new opportunity appears. You choose based on:",
    order: 8,
    options: [
      {
        key: "A",
        text: "How much measurable impact it has",
        weights: { data: 1, things: 1 },
        traitWeights: { C: 0.4, E: 0.2 }
      },
      {
        key: "B",
        text: "How much new capability it helps you build",
        weights: { ideas: 2 },
        traitWeights: { O: 0.7 }
      }
    ]
  },
  {
    externalCode: "MOT_09",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "Given two role tracks, you gravitate toward:",
    order: 9,
    options: [
      {
        key: "A",
        text: "The one with stronger tools and technical depth",
        weights: { data: 2, things: 1 },
        traitWeights: { C: 0.4, E: -0.2 }
      },
      {
        key: "B",
        text: "The one with stronger mentorship and collaboration",
        weights: { people: 2 },
        traitWeights: { A: 0.5, E: 0.3 }
      }
    ]
  },
  {
    externalCode: "MOT_10",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "After a setback you typically:",
    order: 10,
    options: [
      {
        key: "A",
        text: "Run a structured post-mortem and action list",
        weights: { data: 2 },
        traitWeights: { C: 0.8, N: -0.3 }
      },
      {
        key: "B",
        text: "Talk it through with trusted peers before deciding next steps",
        weights: { people: 2 },
        traitWeights: { A: 0.5, E: 0.2, N: -0.1 }
      }
    ]
  },
  {
    externalCode: "MOT_11",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "For repetitive but critical work, you often:",
    order: 11,
    options: [
      {
        key: "A",
        text: "Standardize and automate where possible",
        weights: { data: 2, things: 1 },
        traitWeights: { C: 0.7 }
      },
      {
        key: "B",
        text: "Rotate methods to keep attention and creativity high",
        weights: { ideas: 2 },
        traitWeights: { O: 0.8 }
      }
    ]
  },
  {
    externalCode: "MOT_12",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "In group conflict, your instinct is to:",
    order: 12,
    options: [
      {
        key: "A",
        text: "Mediate and find shared ground",
        weights: { people: 2 },
        traitWeights: { A: 0.8, E: 0.2 }
      },
      {
        key: "B",
        text: "Clarify roles and reduce overlap quickly",
        weights: { data: 1, things: 1 },
        traitWeights: { C: 0.6 }
      }
    ]
  },
  {
    externalCode: "MOT_13",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "If a manager gives only broad goals, you usually:",
    order: 13,
    options: [
      {
        key: "A",
        text: "Define your own execution path and checkpoints",
        weights: { ideas: 1, data: 1 },
        traitWeights: { O: 0.4, E: -0.2 }
      },
      {
        key: "B",
        text: "Request periodic check-ins and milestone alignment",
        weights: { people: 1, data: 1 },
        traitWeights: { C: 0.5, A: 0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_14",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "Between two project outcomes, you value more:",
    order: 14,
    options: [
      {
        key: "A",
        text: "Clear business result with measurable gains",
        weights: { data: 2 },
        traitWeights: { C: 0.4 }
      },
      {
        key: "B",
        text: "Visible benefit to people and community",
        weights: { people: 2 },
        traitWeights: { A: 0.6 }
      }
    ]
  },
  {
    externalCode: "MOT_15",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "When learning something new, you start with:",
    order: 15,
    options: [
      {
        key: "A",
        text: "Fundamentals and first principles",
        weights: { data: 2 },
        traitWeights: { C: 0.6 }
      },
      {
        key: "B",
        text: "A real use case to explore immediately",
        weights: { things: 1, ideas: 1 },
        traitWeights: { O: 0.6 }
      }
    ]
  },
  {
    externalCode: "MOT_16",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "In presentations, you naturally lead with:",
    order: 16,
    options: [
      {
        key: "A",
        text: "Data points, evidence, and logic flow",
        weights: { data: 2 },
        traitWeights: { C: 0.5, E: -0.1 }
      },
      {
        key: "B",
        text: "Stories, context, and human examples",
        weights: { people: 2 },
        traitWeights: { A: 0.4, E: 0.3 }
      }
    ]
  },
  {
    externalCode: "MOT_17",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "Given compensation styles, you lean toward:",
    order: 17,
    options: [
      {
        key: "A",
        text: "Stable fixed pay and predictable growth",
        weights: { data: 1, people: 1 },
        traitWeights: { N: -0.1, C: 0.5 }
      },
      {
        key: "B",
        text: "Variable pay tied to outcomes and upside",
        weights: { ideas: 1, things: 1 },
        traitWeights: { O: 0.4, E: 0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_18",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "In collaborative work, you usually prefer:",
    order: 18,
    options: [
      {
        key: "A",
        text: "Owning a specialist lane deeply",
        weights: { data: 2, things: 1 },
        traitWeights: { C: 0.5, E: -0.2 }
      },
      {
        key: "B",
        text: "Bridging across functions and connecting teams",
        weights: { people: 2, ideas: 1 },
        traitWeights: { E: 0.5, A: 0.3 }
      }
    ]
  },
  {
    externalCode: "MOT_19",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "When a teammate struggles, you typically:",
    order: 19,
    options: [
      {
        key: "A",
        text: "Share a reusable template or process",
        weights: { data: 2 },
        traitWeights: { C: 0.6, A: 0.1 }
      },
      {
        key: "B",
        text: "Coach live and adapt to their working style",
        weights: { people: 2 },
        traitWeights: { A: 0.7, E: 0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_20",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "You’d rather be known for:",
    order: 20,
    options: [
      {
        key: "A",
        text: "Consistency and reliability under pressure",
        weights: { data: 1, things: 1 },
        traitWeights: { C: 0.8 }
      },
      {
        key: "B",
        text: "Original thinking and fresh direction",
        weights: { ideas: 2 },
        traitWeights: { O: 0.8 }
      }
    ]
  },
  {
    externalCode: "MOT_21",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "For side projects, you are more likely to choose:",
    order: 21,
    options: [
      {
        key: "A",
        text: "A tool or system optimization build",
        weights: { things: 1, data: 1 },
        traitWeights: { C: 0.4, O: 0.2 }
      },
      {
        key: "B",
        text: "A community-facing initiative or story-led project",
        weights: { people: 2, ideas: 1 },
        traitWeights: { E: 0.4, A: 0.3 }
      }
    ]
  },
  {
    externalCode: "MOT_22",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "Under pressure, you tend to prioritize:",
    order: 22,
    options: [
      {
        key: "A",
        text: "Reducing uncertainty and preserving consistency",
        weights: { data: 2 },
        traitWeights: { C: 0.7, N: -0.2 }
      },
      {
        key: "B",
        text: "Capturing the best available opportunity quickly",
        weights: { ideas: 2 },
        traitWeights: { O: 0.6, E: 0.2 }
      }
    ]
  },
  {
    externalCode: "MOT_23",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "For long-term growth, you more often choose:",
    order: 23,
    options: [
      {
        key: "A",
        text: "Deep specialization in one domain",
        weights: { data: 2, things: 1 },
        traitWeights: { C: 0.5, O: -0.1 }
      },
      {
        key: "B",
        text: "A cross-domain portfolio with broader flexibility",
        weights: { ideas: 2, people: 1 },
        traitWeights: { O: 0.7 }
      }
    ]
  },
  {
    externalCode: "MOT_24",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "When public credit is limited, you stay energized by:",
    order: 24,
    options: [
      {
        key: "A",
        text: "Knowing the system now performs better",
        weights: { data: 1, things: 1 },
        traitWeights: { C: 0.5, E: -0.1 }
      },
      {
        key: "B",
        text: "Seeing people clearly benefit from the outcome",
        weights: { people: 2 },
        traitWeights: { A: 0.6 }
      }
    ]
  },
  {
    externalCode: "MOT_25",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "In career planning, you lean toward:",
    order: 25,
    options: [
      {
        key: "A",
        text: "Clear progression path and role clarity",
        weights: { data: 2 },
        traitWeights: { C: 0.6, N: -0.1 }
      },
      {
        key: "B",
        text: "Flexibility to pivot across roles over time",
        weights: { ideas: 2 },
        traitWeights: { O: 0.7 }
      }
    ]
  },
  {
    externalCode: "MOT_26",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "When a new tool appears, you usually:",
    order: 26,
    options: [
      {
        key: "A",
        text: "Wait for reliability evidence before adopting",
        weights: { data: 2 },
        traitWeights: { C: 0.6, O: -0.1 }
      },
      {
        key: "B",
        text: "Pilot it early in a low-risk slice",
        weights: { ideas: 2 },
        traitWeights: { O: 0.6 }
      }
    ]
  },
  {
    externalCode: "MOT_27",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "In work socials, you usually:",
    order: 27,
    options: [
      {
        key: "A",
        text: "Stay with a close circle for deeper conversation",
        weights: { people: 1, ideas: 1 },
        traitWeights: { E: -0.5, A: 0.2 }
      },
      {
        key: "B",
        text: "Circulate across groups to meet more people",
        weights: { people: 2 },
        traitWeights: { E: 0.7 }
      }
    ]
  },
  {
    externalCode: "MOT_28",
    category: QUESTION_CATEGORIES.MOTIVATION,
    stem: "Between two offers, you’d usually prioritize:",
    order: 28,
    options: [
      {
        key: "A",
        text: "Stronger mission alignment with your values",
        weights: { people: 1, ideas: 1 },
        traitWeights: { A: 0.4, O: 0.3 }
      },
      {
        key: "B",
        text: "Higher public visibility and career signaling",
        weights: { people: 2 },
        traitWeights: { E: 0.6 }
      }
    ]
  },
  {
    externalCode: "WRI_1",
    category: QUESTION_CATEGORIES.WRITING,
    stem: "In 3–5 sentences, describe a real problem you enjoyed tackling (school, home, or hobby) and what you learned about how you work.",
    order: 1,
    options: []
  }
];

const questions = [
  ...aptitudeQuestions,
  ...bigFiveQuestions,
  ...riasecQuestions,
  ...motivationAndWriting
];

const careers = [
  {
    title: "Data Analyst",
    slug: "data-analyst",
    description: "Analytical roles focused on metrics and insight delivery.",
    requiredSkills: ["SQL", "Statistics", "Visualization"],
    vector: fullVector({
      apt_logical: 0.75,
      apt_numerical: 0.85,
      apt_verbal: 0.55,
      bf_C: 0.7,
      bf_O: 0.55,
      ria_I: 0.8,
      ria_C: 0.65,
      mot_data: 0.9,
      mot_ideas: 0.5
    })
  },
  {
    title: "UX / Product Designer",
    slug: "ux-designer",
    description: "Human-centered design and research.",
    requiredSkills: ["User research", "Prototyping", "Communication"],
    vector: fullVector({
      apt_verbal: 0.65,
      bf_O: 0.85,
      bf_A: 0.75,
      ria_A: 0.85,
      ria_S: 0.55,
      mot_people: 0.65,
      mot_ideas: 0.85
    })
  },
  {
    title: "Software Engineer",
    slug: "software-engineer",
    description: "Building and maintaining software systems.",
    requiredSkills: ["Programming", "Algorithms", "System design"],
    vector: fullVector({
      apt_logical: 0.85,
      apt_numerical: 0.65,
      bf_C: 0.65,
      bf_O: 0.6,
      ria_I: 0.75,
      ria_R: 0.45,
      mot_data: 0.55,
      mot_ideas: 0.7
    })
  },
  {
    title: "People Operations / HR Partner",
    slug: "people-operations",
    description: "Talent, culture, and employee experience.",
    requiredSkills: ["Coaching", "Policy", "Facilitation"],
    vector: fullVector({
      bf_E: 0.75,
      bf_A: 0.85,
      ria_S: 0.85,
      ria_E: 0.65,
      mot_people: 0.95,
      mot_ideas: 0.45
    })
  },
  {
    title: "Field / Operations Technician",
    slug: "operations-technician",
    description: "Hands-on operations and equipment.",
    requiredSkills: ["Safety", "Troubleshooting", "Logistics"],
    vector: fullVector({
      apt_logical: 0.55,
      bf_C: 0.6,
      ria_R: 0.9,
      ria_C: 0.7,
      mot_things: 0.9,
      mot_data: 0.45
    })
  },
  {
    title: "Stream fit — PCM (Math / Physics / Chem)",
    slug: "stream-pcm",
    description: "Science stream oriented to engineering, technology, and quantitative fields.",
    requiredSkills: ["Mathematics", "Physics", "Analytical reasoning"],
    vector: fullVector({
      apt_logical: 0.85,
      apt_numerical: 0.9,
      apt_verbal: 0.55,
      ria_I: 0.85,
      ria_R: 0.55,
      mot_data: 0.75,
      mot_ideas: 0.65
    })
  },
  {
    title: "Stream fit — PCB (Bio / Chem / Physics)",
    slug: "stream-pcb",
    description: "Science stream oriented to medicine, life sciences, and research.",
    requiredSkills: ["Biology", "Chemistry", "Attention to detail"],
    vector: fullVector({
      apt_verbal: 0.65,
      bf_C: 0.75,
      bf_A: 0.7,
      ria_I: 0.9,
      ria_R: 0.5,
      mot_ideas: 0.6,
      mot_data: 0.55
    })
  },
  {
    title: "Stream fit — Commerce & business studies",
    slug: "stream-commerce",
    description: "Commerce, accounting, economics, and business pathways.",
    requiredSkills: ["Numeracy", "Communication", "Structured thinking"],
    vector: fullVector({
      apt_numerical: 0.75,
      bf_C: 0.7,
      ria_E: 0.75,
      ria_C: 0.8,
      mot_data: 0.85,
      mot_people: 0.55
    })
  },
  {
    title: "Stream fit — Humanities & liberal arts",
    slug: "stream-humanities",
    description: "Languages, social sciences, policy, and creative expression.",
    requiredSkills: ["Reading", "Writing", "Critical analysis"],
    vector: fullVector({
      apt_verbal: 0.9,
      bf_O: 0.85,
      bf_A: 0.75,
      ria_A: 0.8,
      ria_S: 0.7,
      mot_people: 0.65,
      mot_ideas: 0.8
    })
  },
  {
    title: "Stream fit — Hybrid / interdisciplinary",
    slug: "stream-hybrid",
    description: "Blends STEM with design, social impact, or entrepreneurship.",
    requiredSkills: ["Adaptability", "Communication", "Systems thinking"],
    vector: fullVector({
      apt_logical: 0.7,
      apt_verbal: 0.7,
      bf_O: 0.8,
      ria_I: 0.65,
      ria_A: 0.65,
      mot_ideas: 0.85,
      mot_people: 0.6
    })
  }
];

const SEED_CATEGORIES = [
  QUESTION_CATEGORIES.APTITUDE_LOGICAL,
  QUESTION_CATEGORIES.APTITUDE_NUMERICAL,
  QUESTION_CATEGORIES.APTITUDE_VERBAL,
  QUESTION_CATEGORIES.BIG_FIVE,
  QUESTION_CATEGORIES.RIASEC,
  QUESTION_CATEGORIES.MOTIVATION,
  QUESTION_CATEGORIES.WRITING
];

function toQuestionRow(q) {
  let options = q.options ?? [];
  if (q.category === QUESTION_CATEGORIES.BIG_FIVE && q.useLikert) {
    options = [{ likertReverse: !!q.likertReverse }];
  } else if (q.category === QUESTION_CATEGORIES.RIASEC && q.useLikert && q.riasecKey) {
    options = [{ riasecKey: q.riasecKey }];
  }
  const keys = q.assessmentKeys ?? assessmentKeysForCode(q.externalCode);
  const flow = q.flowRules && Object.keys(q.flowRules).length ? q.flowRules : {};
  return {
    category: q.category,
    stem: q.stem,
    big_five_key: q.bigFiveKey ?? null,
    use_likert: q.useLikert ?? false,
    options,
    sort_order: q.order,
    active: true,
    external_code: q.externalCode,
    flow_rules: flow,
    assessment_keys: keys
  };
}

/** Strip keys for older DBs missing migration 003 (PostgREST PGRST204). */
function omitKeys(row, keys) {
  const o = { ...row };
  for (const k of keys) delete o[k];
  return o;
}

/**
 * Insert question rows; retry with fewer columns if schema is behind migrations.
 * external_code is required for adaptive flow — if it fails, user must run supabase/run_before_seed.sql
 */
async function insertQuestionRows(rows) {
  let payload = rows;
  let { error } = await supabase.from("questions").insert(payload);
  if (!error) return;

  const schemaHint = (extra) =>
    new Error(
      `${extra}\nRun in Supabase SQL Editor: copy/paste from careerGUIDE/supabase/run_before_seed.sql then re-run: node scripts/seed.mjs`
    );

  let msg = String(error.message || error.code || "");
  if (/assessment_keys|PGRST204|schema cache/i.test(msg)) {
    // eslint-disable-next-line no-console
    console.warn("[seed] Retrying without assessment_keys (column missing on questions table).");
    payload = rows.map((r) => omitKeys(r, ["assessment_keys"]));
    ({ error } = await supabase.from("questions").insert(payload));
    if (!error) {
      // eslint-disable-next-line no-console
      console.warn("[seed] OK — add assessment_keys later via run_before_seed.sql for per-track filtering.");
      return;
    }
    msg = String(error.message || error.code || "");
  }

  if (/flow_rules|PGRST204|schema cache/i.test(msg)) {
    // eslint-disable-next-line no-console
    console.warn("[seed] Retrying without flow_rules.");
    payload = rows.map((r) => omitKeys(r, ["assessment_keys", "flow_rules"]));
    ({ error } = await supabase.from("questions").insert(payload));
    if (!error) return;
    msg = String(error.message || error.code || "");
  }

  if (/external_code|PGRST204|schema cache/i.test(msg)) {
    throw schemaHint("questions.external_code is missing (required for adaptive assessments).");
  }

  throw error;
}

async function run() {
  const { error: delQ } = await supabase.from("questions").delete().in("category", SEED_CATEGORIES);
  if (delQ) throw delQ;

  await supabase.from("career_patterns").delete().in(
    "slug",
    careers.map((c) => c.slug)
  );

  await insertQuestionRows(questions.map(toQuestionRow));

  const careerRows = careers.map((c) => ({
    title: c.title,
    slug: c.slug,
    description: c.description,
    vector: c.vector,
    required_skills: c.requiredSkills,
    active: true
  }));

  const { error: cErr } = await supabase.from("career_patterns").insert(careerRows);
  if (cErr) throw cErr;

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${questions.length} questions (${bigFiveBank.length} Big Five + ${riasecBank.length} RIASEC + aptitude/motivation/writing) and ${careers.length} career patterns.`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

import type { BranchingModuleConfig } from "./module-config.types";

/** M12 — Collaboration SJT (SS03) — team coordination & shared ownership */
export const M12_CONFIG: BranchingModuleConfig = {
  moduleId: "SS03",
  engineType: "branching",
  title: "Collaboration SJT",
  scoring: {
    provider: "rule",
    constructs: ["COLLABORATION", "COORDINATION", "COOPERATION", "TEAMWORK"]
  },
  fastResponseMs: 8000,
  impulsiveMs: 3500,
  hesitationMs: 15000,
  scenarios: [
    {
      id: "C1",
      title: "Uneven workload",
      setting: "Your team has a joint deliverable due Friday. You notice one person doing most of the work.",
      entryNodeId: "C1-N1",
      difficulty: 1,
      telemetryTags: ["collaboration", "workload"],
      adaptiveTags: ["de-escalation"],
      nodes: [
        {
          id: "C1-N1",
          type: "narrative",
          speaker: "Situation",
          avatar: "narrator",
          narrative:
            "Sam has quietly taken on three sections while others contribute sporadically. Sam messages the group: \"I'm overwhelmed — can someone help?\"",
          difficulty: 1
        },
        {
          id: "C1-N2",
          type: "choice",
          speaker: "Your response",
          avatar: "user",
          narrative: "What do you do first?",
          difficulty: 1,
          options: [
            {
              id: "C1-A",
              label: "A",
              text: "Reply publicly with a task list and ask who can claim each piece by tonight.",
              weights: { collaboration: 0.9, communication: 0.85, empathy: 0.7, escalation: 0.1 },
              consequence: "Ownership clarifies. Sam gets relief without blame.",
              nextNodeId: "C1-N4"
            },
            {
              id: "C1-B",
              label: "B",
              text: "Take one section yourself and say nothing to the rest of the team.",
              weights: { collaboration: 0.4, empathy: 0.5, communication: 0.3 },
              consequence: "Short-term fix, but imbalance continues.",
              nextNodeId: "C1-N3"
            },
            {
              id: "C1-C",
              label: "C",
              text: "Tell Sam to escalate to the instructor since others aren't contributing.",
              weights: { collaboration: 0.25, escalation: 0.7, empathy: 0.3 },
              consequence: "Sam feels abandoned. Trust drops.",
              nextNodeId: "C1-N3"
            },
            {
              id: "C1-D",
              label: "D",
              text: "Suggest a 15-minute sync to rebalance tasks and set check-in times.",
              weights: { collaboration: 0.95, communication: 0.9, empathy: 0.8, escalation: 0.05 },
              consequence: "The team agrees on shared checkpoints.",
              nextNodeId: "C1-N4"
            }
          ]
        },
        {
          id: "C1-N3",
          type: "narrative",
          speaker: "Outcome",
          avatar: "narrator",
          narrative: "Friday arrives with tension. Quality is uneven and Sam is exhausted.",
          difficulty: 2
        },
        {
          id: "C1-N4",
          type: "choice",
          speaker: "Follow-through",
          avatar: "user",
          narrative: "Mid-week, someone misses a checkpoint. You…",
          difficulty: 2,
          options: [
            {
              id: "C1-E",
              label: "A",
              text: "Message them privately to understand blockers and offer a pair session.",
              weights: { collaboration: 0.9, empathy: 0.85, communication: 0.85 },
              consequence: "They re-engage with a realistic plan.",
              nextNodeId: null
            },
            {
              id: "C1-F",
              label: "B",
              text: "Redo their section without discussion to protect the grade.",
              weights: { collaboration: 0.3, assertiveness: 0.5, empathy: 0.25 },
              consequence: "Deliverable ships, but accountability never improves.",
              nextNodeId: null
            },
            {
              id: "C1-G",
              label: "C",
              text: "Raise it in the group chat with neutral facts and ask for a new deadline.",
              weights: { collaboration: 0.75, communication: 0.8, escalation: 0.2 },
              consequence: "The team adjusts without personal attacks.",
              nextNodeId: null
            },
            {
              id: "C1-H",
              label: "D",
              text: "Complain that you're always carrying the team.",
              weights: { escalation: 0.75, collaboration: 0.2, empathy: 0.15 },
              consequence: "Defensiveness spreads. Collaboration stalls.",
              nextNodeId: null
            }
          ]
        }
      ]
    },
    {
      id: "C2",
      title: "Conflicting approaches",
      setting: "Two teammates want opposite solutions for the same problem.",
      entryNodeId: "C2-N1",
      difficulty: 2,
      telemetryTags: ["collaboration", "conflict"],
      adaptiveTags: ["ambiguous"],
      nodes: [
        {
          id: "C2-N1",
          type: "narrative",
          speaker: "Situation",
          avatar: "peer",
          narrative:
            "Jordan wants a bold redesign; Priya wants a minimal fix to meet the deadline. The debate is getting heated in the shared doc.",
          difficulty: 2
        },
        {
          id: "C2-N2",
          type: "choice",
          speaker: "Your move",
          avatar: "user",
          narrative: "How do you help the team decide?",
          difficulty: 2,
          options: [
            {
              id: "C2-A",
              label: "A",
              text: "Side with whoever you agree with to end the argument quickly.",
              weights: { collaboration: 0.25, escalation: 0.5, communication: 0.3 },
              consequence: "One person disengages. Resentment lingers.",
              nextNodeId: "C2-N3"
            },
            {
              id: "C2-B",
              label: "B",
              text: "Facilitate criteria: deadline, risk, user impact — then score both options.",
              weights: { collaboration: 0.95, communication: 0.9, empathy: 0.65 },
              consequence: "The group picks a hybrid with clear rationale.",
              nextNodeId: "C2-N4"
            },
            {
              id: "C2-C",
              label: "C",
              text: "Ask the team lead to decide so you don't have to get involved.",
              weights: { collaboration: 0.35, assertiveness: 0.3, escalation: 0.3 },
              consequence: "Decision happens, but team ownership is weak.",
              nextNodeId: "C2-N3"
            },
            {
              id: "C2-D",
              label: "D",
              text: "Propose a time-boxed prototype of each approach before committing.",
              weights: { collaboration: 0.9, communication: 0.85, empathy: 0.7 },
              consequence: "Evidence replaces opinion. Both voices feel heard.",
              nextNodeId: "C2-N4"
            }
          ]
        },
        {
          id: "C2-N3",
          type: "narrative",
          speaker: "Outcome",
          avatar: "narrator",
          narrative: "The team submits on time but collaboration feels fragile going forward.",
          difficulty: 2
        },
        {
          id: "C2-N4",
          type: "choice",
          speaker: "Closing",
          avatar: "user",
          narrative: "After the decision, how do you close the loop?",
          difficulty: 3,
          options: [
            {
              id: "C2-E",
              label: "A",
              text: "Document the decision and review what worked in a brief retro.",
              weights: { collaboration: 0.9, communication: 0.85 },
              consequence: "Future conflicts resolve faster.",
              nextNodeId: null
            },
            {
              id: "C2-F",
              label: "B",
              text: "Move on without discussion — the decision is made.",
              weights: { collaboration: 0.45, communication: 0.35 },
              consequence: "Unresolved feelings surface on the next project.",
              nextNodeId: null
            },
            {
              id: "C2-G",
              label: "C",
              text: "Thank both teammates for pushing the team to think deeper.",
              weights: { collaboration: 0.85, empathy: 0.9, communication: 0.8 },
              consequence: "Psychological safety improves.",
              nextNodeId: null
            },
            {
              id: "C2-H",
              label: "D",
              text: "Privately tell the 'loser' their idea wasn't practical.",
              weights: { collaboration: 0.2, empathy: 0.2, escalation: 0.4 },
              consequence: "They contribute less next time.",
              nextNodeId: null
            }
          ]
        }
      ]
    },
    {
      id: "C3",
      title: "Remote handoff failure",
      setting: "A distributed team misses a handoff because of timezone gaps.",
      entryNodeId: "C3-N1",
      difficulty: 2,
      telemetryTags: ["collaboration", "remote"],
      adaptiveTags: ["de-escalation", "ambiguous"],
      nodes: [
        {
          id: "C3-N1",
          type: "narrative",
          speaker: "Situation",
          avatar: "narrator",
          narrative:
            "Your evening work depends on a morning update from a teammate in another timezone. It never arrives. The demo is tomorrow.",
          difficulty: 2
        },
        {
          id: "C3-N2",
          type: "choice",
          speaker: "First step",
          avatar: "user",
          narrative: "What is your first move?",
          difficulty: 2,
          options: [
            {
              id: "C3-A",
              label: "A",
              text: "Message them angrily that they've blocked the whole team.",
              weights: { escalation: 0.8, collaboration: 0.15, empathy: 0.1 },
              consequence: "They respond defensively. The handoff stays broken.",
              nextNodeId: "C3-N3"
            },
            {
              id: "C3-B",
              label: "B",
              text: "Check shared docs, attempt a best-effort patch, and log what's missing.",
              weights: { collaboration: 0.7, assertiveness: 0.6, communication: 0.5 },
              consequence: "Demo is salvaged, but root cause remains.",
              nextNodeId: "C3-N4"
            },
            {
              id: "C3-C",
              label: "C",
              text: "Ping them with impact + ask if they need help finishing the handoff tonight.",
              weights: { collaboration: 0.9, empathy: 0.85, communication: 0.9, escalation: 0.1 },
              consequence: "They share a partial update and a plan.",
              nextNodeId: "C3-N4"
            },
            {
              id: "C3-D",
              label: "D",
              text: "Escalate to the whole channel without checking async updates first.",
              weights: { escalation: 0.65, collaboration: 0.3, communication: 0.35 },
              consequence: "Turns out the update was posted — you lose credibility.",
              nextNodeId: "C3-N3"
            }
          ]
        },
        {
          id: "C3-N3",
          type: "narrative",
          speaker: "Outcome",
          avatar: "narrator",
          narrative: "The demo is stressful. Remote coordination doesn't improve for the next sprint.",
          difficulty: 2
        },
        {
          id: "C3-N4",
          type: "choice",
          speaker: "Process fix",
          avatar: "user",
          narrative: "After the demo, how do you improve collaboration?",
          difficulty: 3,
          options: [
            {
              id: "C3-E",
              label: "A",
              text: "Propose shared handoff templates + overlap hours for critical days.",
              weights: { collaboration: 0.95, communication: 0.9, empathy: 0.6 },
              consequence: "Handoffs become predictable.",
              nextNodeId: null
            },
            {
              id: "C3-F",
              label: "B",
              text: "Avoid working with that teammate again.",
              weights: { collaboration: 0.15, empathy: 0.2, escalation: 0.5 },
              consequence: "Team silos form.",
              nextNodeId: null
            },
            {
              id: "C3-G",
              label: "C",
              text: "Run a short retro on timezone norms and definition of 'done' for handoffs.",
              weights: { collaboration: 0.9, communication: 0.85, empathy: 0.7 },
              consequence: "Shared norms reduce repeat failures.",
              nextNodeId: null
            },
            {
              id: "C3-H",
              label: "D",
              text: "Say nothing — it was a one-off.",
              weights: { collaboration: 0.35, communication: 0.25 },
              consequence: "The same gap happens next cycle.",
              nextNodeId: null
            }
          ]
        }
      ]
    }
  ]
};

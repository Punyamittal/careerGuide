import type { BranchingModuleConfig } from "./module-config.types";

/** M11 — Communication SJT (SS02) — branching engine reference module */
export const M11_CONFIG: BranchingModuleConfig = {
  moduleId: "SS02",
  engineType: "branching",
  title: "Communication SJT",
  scoring: {
    provider: "rule",
    constructs: ["COMMUNICATION", "SOCIAL_SKILLS", "EMPATHY"]
  },
  fastResponseMs: 8000,
  impulsiveMs: 3500,
  hesitationMs: 15000,
  scenarios: [
    {
      id: "S1",
      title: "Supporting a struggling teammate",
      setting: "Your team is preparing a presentation. A newer member keeps missing steps.",
      entryNodeId: "S1-N1",
      difficulty: 1,
      telemetryTags: ["communication", "support"],
      adaptiveTags: ["de-escalation"],
      nodes: [
        {
          id: "S1-N1",
          type: "narrative",
          speaker: "Situation",
          avatar: "narrator",
          narrative:
            "Riya joined two weeks ago. She looks overwhelmed during rehearsal and asks you for help in front of the group. A few teammates seem impatient.",
          difficulty: 1,
          tags: ["setup"]
        },
        {
          id: "S1-N2",
          type: "choice",
          speaker: "What do you do?",
          avatar: "user",
          narrative: "Choose how you respond in the moment:",
          difficulty: 1,
          options: [
            {
              id: "S1-A",
              label: "A",
              text: "Take over her section quietly after the meeting and fix it yourself.",
              weights: { empathy: 0.3, assertiveness: 0.2, escalation: 0.1, communication: 0.4 },
              consequence: "Riya feels sidelined. The work gets done, but trust drops.",
              nextNodeId: "S1-N3",
              effects: { toneShift: "tense" }
            },
            {
              id: "S1-B",
              label: "B",
              text: "Suggest a short 1:1 after rehearsal to walk through the steps together.",
              weights: { empathy: 0.9, assertiveness: 0.6, escalation: 0.1, communication: 0.9 },
              consequence: "Riya relaxes. You clarify expectations without embarrassing her.",
              nextNodeId: "S1-N4",
              effects: { unlockBranches: ["supportive_path"], toneShift: "hopeful" }
            },
            {
              id: "S1-C",
              label: "C",
              text: "Call out in the group that everyone must keep up or be replaced.",
              weights: { empathy: 0.1, assertiveness: 0.9, escalation: 0.95, communication: 0.2 },
              consequence: "The room goes silent. Motivation drops across the team.",
              nextNodeId: "S1-N3",
              effects: { lockBranches: ["supportive_path"], toneShift: "tense" }
            },
            {
              id: "S1-D",
              label: "D",
              text: "Ask the group to pair up so experienced members mentor newer ones.",
              weights: { empathy: 0.75, assertiveness: 0.5, escalation: 0.15, communication: 0.85 },
              consequence: "Collaboration improves. Riya gets structured support.",
              nextNodeId: "S1-N4",
              effects: { unlockBranches: ["supportive_path"], toneShift: "hopeful" }
            }
          ]
        },
        {
          id: "S1-N3",
          type: "narrative",
          speaker: "Aftermath",
          avatar: "peer",
          narrative:
            "Tension lingers. Riya participates less in the next meeting. The project stays on track but team energy is low.",
          difficulty: 2,
          tags: ["aftermath-negative"]
        },
        {
          id: "S1-N4",
          type: "choice",
          speaker: "Follow-up",
          avatar: "user",
          narrative: "The next day Riya messages: \"I'm still confused about the timeline.\" You reply by…",
          difficulty: 2,
          options: [
            {
              id: "S1-E",
              label: "A",
              text: "Sending a voice note explaining the timeline with one concrete next step.",
              weights: { empathy: 0.85, communication: 0.9, escalation: 0.05 },
              consequence: "She completes the next milestone on time.",
              nextNodeId: null
            },
            {
              id: "S1-F",
              label: "B",
              text: "Forwarding the group chat and telling her to read it again.",
              weights: { empathy: 0.2, communication: 0.3, escalation: 0.4 },
              consequence: "She stops asking questions and misses a deadline.",
              nextNodeId: null
            },
            {
              id: "S1-G",
              label: "C",
              text: "Scheduling a 10-minute check-in and co-editing the timeline live.",
              weights: { empathy: 0.95, communication: 0.95, escalation: 0.05 },
              consequence: "Clarity improves for the whole pod.",
              nextNodeId: null
            },
            {
              id: "S1-H",
              label: "D",
              text: "Asking the team lead to handle it since it's not your role.",
              weights: { empathy: 0.35, assertiveness: 0.3, escalation: 0.2, communication: 0.4 },
              consequence: "The lead helps, but Riya feels you avoided her.",
              nextNodeId: null
            }
          ]
        }
      ]
    },
    {
      id: "S2",
      title: "Unclear instructions",
      setting: "Your manager sends a vague brief with a tight deadline.",
      entryNodeId: "S2-N1",
      difficulty: 2,
      telemetryTags: ["communication", "clarity"],
      adaptiveTags: ["ambiguous"],
      nodes: [
        {
          id: "S2-N1",
          type: "narrative",
          speaker: "Situation",
          avatar: "manager",
          narrative:
            "Your manager writes: \"Make the deck sharper by Friday.\" No examples, no audience, no success criteria.",
          difficulty: 2
        },
        {
          id: "S2-N2",
          type: "choice",
          speaker: "Your move",
          avatar: "user",
          narrative: "How do you respond?",
          difficulty: 2,
          options: [
            {
              id: "S2-A",
              label: "A",
              text: "Start redesigning immediately based on your best guess.",
              weights: { assertiveness: 0.5, escalation: 0.3, communication: 0.35 },
              consequence: "You ship fast but miss the manager's hidden expectation.",
              nextNodeId: "S2-N3"
            },
            {
              id: "S2-B",
              label: "B",
              text: "Reply with three clarifying questions and a proposed outline.",
              weights: { empathy: 0.6, assertiveness: 0.7, communication: 0.95, escalation: 0.1 },
              consequence: "Your manager replies with specifics within an hour.",
              nextNodeId: "S2-N4"
            },
            {
              id: "S2-C",
              label: "C",
              text: "Complain in the team channel that the brief is impossible.",
              weights: { empathy: 0.15, escalation: 0.85, communication: 0.2 },
              consequence: "Morale dips. The manager feels disrespected.",
              nextNodeId: "S2-N3"
            },
            {
              id: "S2-D",
              label: "D",
              text: "Book a 15-minute sync to confirm audience, tone, and must-have slides.",
              weights: { empathy: 0.7, assertiveness: 0.75, communication: 0.9, escalation: 0.05 },
              consequence: "Alignment is clear. Rework is minimal.",
              nextNodeId: "S2-N4"
            }
          ]
        },
        {
          id: "S2-N3",
          type: "narrative",
          speaker: "Outcome",
          avatar: "narrator",
          narrative: "Friday arrives. Major revisions are requested. Stress spikes across the team.",
          difficulty: 2
        },
        {
          id: "S2-N4",
          type: "choice",
          speaker: "Mid-project",
          avatar: "user",
          narrative: "Halfway through, scope expands. You…",
          difficulty: 3,
          options: [
            {
              id: "S2-E",
              label: "A",
              text: "Document the new scope and confirm trade-offs in writing.",
              weights: { communication: 0.9, assertiveness: 0.8, escalation: 0.1 },
              consequence: "Expectations stay realistic.",
              nextNodeId: null
            },
            {
              id: "S2-F",
              label: "B",
              text: "Silently absorb extra work to avoid conflict.",
              weights: { empathy: 0.5, escalation: 0.2, communication: 0.3 },
              consequence: "You burn out; quality slips on other tasks.",
              nextNodeId: null
            },
            {
              id: "S2-G",
              label: "C",
              text: "Push back with data on timeline impact and offer two alternatives.",
              weights: { communication: 0.85, assertiveness: 0.85, empathy: 0.55 },
              consequence: "A reasonable compromise is agreed.",
              nextNodeId: null
            },
            {
              id: "S2-D2",
              label: "D",
              text: "Escalate emotionally in the stand-up.",
              weights: { escalation: 0.9, communication: 0.15 },
              consequence: "The meeting derails. Trust erodes.",
              nextNodeId: null
            }
          ]
        }
      ]
    },
    {
      id: "S3",
      title: "Peer missing deadlines",
      setting: "A peer's delay is blocking your part of the project.",
      entryNodeId: "S3-N1",
      difficulty: 2,
      telemetryTags: ["communication", "accountability"],
      adaptiveTags: ["de-escalation", "ambiguous"],
      nodes: [
        {
          id: "S3-N1",
          type: "narrative",
          speaker: "Situation",
          avatar: "peer",
          narrative:
            "Alex missed two handoffs. You need their input to finish your section by tomorrow. They haven't replied to chat.",
          difficulty: 2
        },
        {
          id: "S3-N2",
          type: "choice",
          speaker: "First step",
          avatar: "user",
          narrative: "What is your first move?",
          difficulty: 2,
          options: [
            {
              id: "S3-A",
              label: "A",
              text: "Message Alex privately: share impact + ask if they need help.",
              weights: { empathy: 0.85, communication: 0.9, escalation: 0.1 },
              consequence: "Alex apologises and shares a partial draft tonight.",
              nextNodeId: "S3-N4",
              effects: { unlockBranches: ["collab_fix"] }
            },
            {
              id: "S3-B",
              label: "B",
              text: "CC the manager immediately with a blame-focused email.",
              weights: { escalation: 0.8, empathy: 0.2, communication: 0.25 },
              consequence: "Alex becomes defensive. The relationship sours.",
              nextNodeId: "S3-N3"
            },
            {
              id: "S3-C",
              label: "C",
              text: "Do their portion yourself without telling anyone.",
              weights: { empathy: 0.4, assertiveness: 0.3, communication: 0.35 },
              consequence: "Deadline met, but workload imbalance grows hidden.",
              nextNodeId: "S3-N3"
            },
            {
              id: "S3-D",
              label: "D",
              text: "Propose a quick sync with Alex + shared checklist for remaining tasks.",
              weights: { empathy: 0.75, communication: 0.9, collaboration: 0.85, escalation: 0.1 },
              consequence: "Ownership clarifies. Handoffs improve.",
              nextNodeId: "S3-N4",
              effects: { unlockBranches: ["collab_fix"] }
            }
          ]
        },
        {
          id: "S3-N3",
          type: "narrative",
          speaker: "Outcome",
          avatar: "narrator",
          narrative: "The project limps to the deadline. Future collaboration with Alex feels awkward.",
          difficulty: 2
        },
        {
          id: "S3-N4",
          type: "choice",
          speaker: "Closing the loop",
          avatar: "user",
          narrative: "After delivery, how do you close the loop?",
          difficulty: 3,
          options: [
            {
              id: "S3-E",
              label: "A",
              text: "Debrief with Alex on what blocked them and agree on signals for next time.",
              weights: { empathy: 0.9, communication: 0.9, escalation: 0.05 },
              consequence: "Process improves for the next sprint.",
              nextNodeId: null
            },
            {
              id: "S3-F",
              label: "B",
              text: "Avoid the topic and hope it doesn't repeat.",
              weights: { communication: 0.25, empathy: 0.3 },
              consequence: "The same delay pattern returns.",
              nextNodeId: null
            },
            {
              id: "S3-G",
              label: "C",
              text: "Share a team retro note on handoff norms (no names).",
              weights: { communication: 0.85, collaboration: 0.8, empathy: 0.6 },
              consequence: "The team adopts clearer checkpoints.",
              nextNodeId: null
            },
            {
              id: "S3-H",
              label: "D",
              text: "Make a sarcastic comment in the group chat.",
              weights: { escalation: 0.75, empathy: 0.1, communication: 0.15 },
              consequence: "Team culture takes a hit.",
              nextNodeId: null
            }
          ]
        }
      ]
    }
  ]
};

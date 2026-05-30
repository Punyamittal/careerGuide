import type { EventDomainId, EventTypeId } from "./types";

/**
 * Subcategory-scoped narrative events (MBS-aligned, exploratory).
 * Keys match SUBCATEGORIES labels in taxonomy.ts.
 */
export const SUBCATEGORY_EVENT_MAP: Partial<
  Record<EventDomainId, Record<string, string[]>>
> = {
  relationships: {
    Parents: [
      "I was frequently compared to a sibling or cousin",
      "I felt emotionally supported by my parents",
      "I was pressured academically by my family",
      "I feared disappointing my family",
      "I learned responsibility early at home",
      "I had conflict with parental expectations",
      "I became the emotional caregiver in my family"
    ],
    Siblings: [
      "I competed with a sibling for attention",
      "I felt protected by an older sibling",
      "I drifted apart from a sibling over time",
      "I shared secrets with a sibling that shaped me"
    ],
    Friends: [
      "I found a friend group where I belonged",
      "I was betrayed by someone I trusted",
      "I lost touch with close friends after a move",
      "I learned loyalty through friendship"
    ],
    "Teacher / Mentor": [
      "A teacher believed in me when I doubted myself",
      "I was unfairly judged by a teacher",
      "I found a mentor who opened new possibilities",
      "I was singled out in class in a painful way"
    ],
    "Boss / Team Lead": [
      "I had a manager who micromanaged me",
      "I received recognition that boosted my confidence",
      "I clashed with authority at work",
      "I learned professionalism from a strong leader"
    ],
    "Romantic Partner": [
      "A relationship changed how I see myself",
      "I learned boundaries through heartbreak",
      "I felt deeply supported by a partner",
      "I lost trust after a difficult breakup"
    ],
    "Public / Society": [
      "I felt judged by society or community norms",
      "I found belonging in a wider community",
      "I experienced public embarrassment",
      "I was celebrated publicly for an achievement"
    ],
    "Authority Figure": [
      "I had conflict with authority",
      "I learned to respect rules I disagreed with",
      "An authority figure changed my path",
      "I stood up to someone in power"
    ]
  },
  career_education: {
    "Subject Choice": [
      "I chose a stream or major that excited me",
      "I picked subjects under family pressure",
      "I discovered a subject I was naturally good at",
      "I regretted a subject choice later"
    ],
    "Exams / Results": [
      "I failed an important exam",
      "I exceeded expectations on a major test",
      "Exam stress changed how I see myself",
      "Results shifted what others expected of me"
    ],
    "Internship / Work": [
      "An internship changed how I see work",
      "I felt unprepared in my first real role",
      "Work experience confirmed a career direction",
      "I burned out during an intense work period"
    ],
    "Mentor / Guide": [
      "I found a mentor who changed my direction",
      "I lost access to guidance I depended on",
      "A guide pushed me beyond my comfort zone"
    ],
    "Stream / Major Decision": [
      "I changed stream or major mid-way",
      "I committed to a path I still question",
      "A major decision opened unexpected doors"
    ],
    "Career Pivot": [
      "I changed career direction",
      "I felt lost about my future",
      "I discovered a talent that redirected me",
      "I lost confidence academically or professionally"
    ]
  },
  situation: {
    Comparison: [
      "I was compared with someone",
      "Comparison made me work harder",
      "Comparison made me feel never enough",
      "I stopped comparing myself and felt relief"
    ],
    Transition: [
      "I changed school or city",
      "I changed schools frequently",
      "A move disrupted my friendships",
      "Transition taught me to start over"
    ],
    Achievement: [
      "I achieved something I worked hard for",
      "An achievement felt empty afterward",
      "Public achievement changed how others saw me"
    ],
    Failure: [
      "I failed publicly and felt ashamed",
      "Failure taught me resilience",
      "I avoided trying again after a failure"
    ],
    "Social Pressure": [
      "I faced social pressure to fit in",
      "I resisted pressure and felt isolated",
      "Pressure pushed me toward the wrong choice"
    ]
  },
  identity_confidence: {
    "Self-image": [
      "I rebuilt my self-image after a setback",
      "I hid part of myself from others",
      "I discovered who I want to be",
      "I felt ashamed of myself for a long time"
    ],
    Belonging: [
      "I felt I finally belonged somewhere",
      "I felt excluded by a group",
      "Belonging at school or work changed my confidence"
    ],
    "Courage / Voice": [
      "I spoke up for the first time",
      "I learned to set boundaries",
      "I stayed silent when I wished I had spoken"
    ]
  },
  ksa: {
    "Talent Recognized": [
      "I discovered a talent",
      "Someone recognized an ability I ignored",
      "I was told I was not good enough",
      "I mastered a difficult skill"
    ],
    "Performance Pressure": [
      "I struggled with performance pressure",
      "Pressure helped me achieve more",
      "I avoided challenges because of fear of failing"
    ],
    "Leadership / Teamwork": [
      "I led a team for the first time",
      "I learned to collaborate under stress",
      "I failed as a leader and learned from it"
    ]
  },
  money_opportunity: {
    "Financial Pressure": [
      "I faced financial pressure",
      "Money stress affected my choices",
      "I became financially independent",
      "I lost an economic opportunity"
    ],
    "Scholarship / Aid": [
      "I received a scholarship or grant",
      "I almost missed school because of costs",
      "Aid changed what felt possible for me"
    ]
  },
  health_energy: {
    "Burnout / Exhaustion": [
      "I burned out",
      "Exhaustion changed my priorities",
      "I learned to manage stress",
      "My energy crashed during exams"
    ],
    "Recovery / Healing": [
      "I recovered from illness or injury",
      "Healing taught me patience with myself",
      "I started prioritizing wellbeing"
    ]
  },
  values_philosophy: {
    Purpose: [
      "I found a sense of purpose",
      "I questioned what success means",
      "Purpose conflicted with family expectations"
    ],
    "Worldview Shift": [
      "My beliefs were challenged",
      "I adopted a new philosophy",
      "A worldview shift changed my career thinking"
    ]
  }
};

/** Event-type flavor: prepends or boosts type-specific narratives. */
export const EVENT_TYPE_EVENTS: Partial<Record<EventTypeId, string[]>> = {
  first_time: [
    "I remember the first time this shaped me clearly",
    "A first-time experience stayed with me for years"
  ],
  repeated: [
    "This kept happening until it became part of who I am",
    "A repeated pattern slowly changed my reactions"
  ],
  life_changing: [
    "This changed my confidence or direction",
    "A life-changing moment redirected my path"
  ],
  special: [
    "Something rare or symbolic left a deep mark",
    "An emotionally intense moment still feels vivid"
  ]
};

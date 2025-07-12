import { PredefinedActivity } from '../types/activities';

// Complete predefined activities list with category emojis 🌟
export const PREDEFINED_ACTIVITIES: PredefinedActivity[] = [
  /* ---------- FITNESS 🏋️ ---------- */
  {
    id: 'F1',
    category: 'Fitness 🏋️',
    name: 'Hypertrophie-Workout ≥ 60 min (RIR ≤ 2)',
    level: 'Hard',
    points: 30,
    isDiminishing: true,
    dailyCap: 1,
    comment: 'Maximal 1× pro Tag für gesunde Erholung'
  },
  {
    id: 'F2',
    category: 'Fitness 🏋️',
    name: 'Mobility / Active Recovery ≥ 20 min',
    level: 'Light',
    points: 12,
    isDiminishing: true,
    comment: 'Zweiter Block = 0,75×'
  },
  {
    id: 'F3',
    category: 'Fitness 🏋️',
    name: 'Ganzen Tag Makros exakt getrackt',
    level: '—',
    points: 10,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Kann nur 1×/Tag vorkommen'
  },

  /* ---------- MOVEMENT 🚴 ---------- */
  {
    id: 'M1',
    category: 'Movement 🚴',
    name: 'Leichter Walk / Gehen (15–30 min, ≥ 3 MET)',
    level: 'Move-Light',
    points: 8,
    isDiminishing: true,
    dailyCap: 2,
    comment: 'Zweite Einheit 0,75× – NEAT-Booster'
  },
  {
    id: 'M2',
    category: 'Movement 🚴',
    name: 'Moderates Cardio (Rad < 20 km/h, Jog 6–8 km/h, 30–60 min)',
    level: 'Move-Mod',
    points: 12,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Zone-2-Ausdauer, 1×/Tag'
  },
  {
    id: 'M3',
    category: 'Movement 🚴',
    name: 'Intensives Cardio (Rad > 20 km/h, zügiges Laufen, > 60 min)',
    level: 'Move-Intense',
    points: 18,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Hoher Load, aber < Kraft-Workout'
  },

  /* ---------- STEPS 👟 ---------- */
  {
    id: 'S3',
    category: 'Steps 👟',
    name: 'Schrittziel erreicht (≥ 8 000 Schritte)',
    level: 'Daily-Bin',
    points: 10,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Binäre Tagesaufgabe – WHO Guideline'
  },

  /* ---------- WORK 💻 ---------- */
  {
    id: 'W1',
    category: 'Work 💻',
    name: '6–8 h fokussierter Arbeitstag',
    level: 'Base',
    points: 15,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Tages-Token'
  },
  {
    id: 'W2',
    category: 'Work 💻',
    name: '„Flow-Tag“ > 1 Key-Deliverable',
    level: 'Elite',
    points: 25,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Max. 1×/Tag'
  },

  /* ---------- READING 📚 ---------- */
  {
    id: 'R1',
    category: 'Reading 📚',
    name: '20 min Fach-/Selbstentwicklungslektüre',
    level: 'Base',
    points: 10,
    isDiminishing: true,
    comment: '2. Session 0,75×'
  },
  {
    id: 'R2',
    category: 'Reading 📚',
    name: '60 min + Notizen',
    level: 'Deep',
    points: 18,
    isDiminishing: true,
    dailyCap: 2,
    comment: 'Langform-Deep-Reading'
  },

  /* ---------- SELF-CARE 🌿 ---------- */
  {
    id: 'S1',
    category: 'Self-Care 🌿',
    name: 'Wohnung verschönern, Wellness, langer Walk',
    level: '—',
    points: 10,
    isDiminishing: true,
    comment: 'Vermeidet Token-Grinding'
  },
  {
    id: 'S2',
    category: 'Self-Care 🌿',
    name: '„Growth Day“ (Bauernhof, Retreat etc.)',
    level: 'XL',
    points: 20,
    isDiminishing: false,
    weeklyCap: 1,
    comment: 'Seltene Events'
  },

  /* ---------- SOCIAL 🤝 ---------- */
  {
    id: 'SO1',
    category: 'Social 🤝',
    name: 'Treffen mit Freunden (Comfort-Zone)',
    level: 'Base',
    points: 8,
    isDiminishing: true,
    comment: '2. Treffen 0,75×'
  },
  {
    id: 'SO2',
    category: 'Social 🤝',
    name: 'Event > 2 h, neue Leute',
    level: 'Bold',
    points: 15,
    isDiminishing: true,
    dailyCap: 1,
    comment: 'Hoher Aufwand → diminishing'
  },

  /* ---------- PLANNING 📅 ---------- */
  {
    id: 'P1',
    category: 'Planning 📅',
    name: 'Event/Ticket gebucht & kalendriert',
    level: '—',
    points: 12,
    isDiminishing: false,
    comment: 'Jeder Plan zählt voll'
  },
  {
    id: 'P2',
    category: 'Planning 📅',
    name: 'Monats-Roadmap / OKRs überarbeitet',
    level: '—',
    points: 15,
    isDiminishing: false,
    weeklyCap: 1,
    comment: 'Max. 1×/Woche'
  },

  /* ---------- ORGANISATION 🗂️ ---------- */
  {
    id: 'O1',
    category: 'Organisation 🗂️',
    name: 'Rechnungen, Supplement-Order etc.',
    level: 'Quick',
    points: 5,
    isDiminishing: true,
    comment: 'Mehrere Mini-Tasks dim.'
  },
  {
    id: 'O2',
    category: 'Organisation 🗂️',
    name: '> 1 h Admin-Sprint',
    level: 'Deep',
    points: 12,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Klar abgrenzbarer Block'
  },

  /* ---------- DIGITAL-DETOX 📵 ---------- */
  {
    id: 'D1',
    category: 'Digital-Detox 📵',
    name: '30 min Smartphone-frei',
    level: 'Block',
    points: 3,
    isDiminishing: false,
    dailyCap: 4,
    comment: 'Cap = 4×/Tag'
  },
  {
    id: 'D2',
    category: 'Digital-Detox 📵',
    name: '2 h Deep-Work offline',
    level: 'Block+',
    points: 10,
    isDiminishing: false,
    dailyCap: 2,
    comment: 'Cap = 2×/Tag'
  },

  /* ---------- PSYCHE 🧠 ---------- */
  {
    id: 'PS1',
    category: 'Psyche 🧠',
    name: '10 min Meditation / CBT-Journaling',
    level: 'Base',
    points: 5,
    isDiminishing: true,
    comment: '2. Session 0,75×'
  },
  {
    id: 'PS2',
    category: 'Psyche 🧠',
    name: '< 10 min OCD-Loop (Selbst-Check)',
    level: 'Clean',
    points: 8,
    isDiminishing: false,
    dailyCap: 1,
    comment: 'Tages-Status'
  }
];

/* Helpers stay unchanged */
export function getActivityById(id: string): PredefinedActivity | undefined {
  return PREDEFINED_ACTIVITIES.find(activity => activity.id === id);
}

export function calculateDiminishedPoints(
  activity: PredefinedActivity,
  count: number
): { points: number; factor: number } {
  if (!activity.isDiminishing || count === 0) {
    return { points: activity.points, factor: 1.0 };
  }

  // Apply diminishing returns: 1st = 100 %, 2nd = 75 %, 3rd+ = 50 %
  let factor = 1.0;
  if (count === 1) factor = 0.75;
  else if (count >= 2) factor = 0.5;

  return {
    points: Math.round(activity.points * factor),
    factor
  };
}
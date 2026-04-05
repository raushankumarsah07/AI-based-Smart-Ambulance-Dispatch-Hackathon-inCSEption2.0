// ============================================
// SmartAmbSys - AI Triage Engine
// Keyword-based emergency triage classifier
// ============================================

import {
  SeverityLevel,
  Specialization,
  TriageResult,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Keyword dictionaries
// ---------------------------------------------------------------------------

const P1_KEYWORDS = [
  "cardiac arrest",
  "heart stopped",
  "not breathing",
  "stopped breathing",
  "unconscious",
  "unresponsive",
  "severe bleeding",
  "heavy bleeding",
  "massive bleeding",
  "hemorrhage",
  "gunshot",
  "shot",
  "stabbing",
  "stabbed",
  "major accident",
  "multi-vehicle",
  "building collapse",
  "electrocution",
  "drowning",
  "choking",
  "anaphylaxis",
  "anaphylactic",
];

const P2_KEYWORDS = [
  "chest pain",
  "heart attack",
  "stroke",
  "slurred speech",
  "facial droop",
  "broken bone",
  "fracture",
  "compound fracture",
  "head injury",
  "head trauma",
  "concussion",
  "burns",
  "severe burn",
  "second degree burn",
  "third degree burn",
  "fall from height",
  "fell from",
  "high fall",
  "seizure",
  "convulsion",
  "difficulty breathing",
  "shortness of breath",
  "deep laceration",
  "impaled",
  "hit by car",
  "pedestrian accident",
];

const P3_KEYWORDS = [
  "minor fracture",
  "hairline fracture",
  "mild burn",
  "first degree burn",
  "abdominal pain",
  "stomach pain",
  "fever",
  "high temperature",
  "allergic reaction",
  "swelling",
  "hives",
  "moderate bleeding",
  "sprained ankle",
  "twisted knee",
  "dislocated",
  "dislocation",
  "asthma attack",
  "vomiting blood",
  "severe vomiting",
];

const P4_KEYWORDS = [
  "minor cut",
  "small cut",
  "sprain",
  "mild fever",
  "low grade fever",
  "rash",
  "skin rash",
  "minor bruise",
  "bruise",
  "scrape",
  "scratch",
  "insect bite",
  "bee sting",
  "twisted ankle",
  "nosebleed",
  "sore throat",
  "earache",
  "minor wound",
];

// Specialization keyword groups
const CARDIAC_KEYWORDS = [
  "cardiac",
  "heart",
  "chest pain",
  "heart attack",
  "cardiac arrest",
  "heart stopped",
  "palpitations",
  "arrhythmia",
];

const TRAUMA_KEYWORDS = [
  "accident",
  "crash",
  "collision",
  "hit by",
  "fall",
  "fell",
  "fracture",
  "broken",
  "gunshot",
  "shot",
  "stabbing",
  "stabbed",
  "impaled",
  "laceration",
  "bleeding",
  "hemorrhage",
  "crush",
  "multi-vehicle",
  "pedestrian",
  "building collapse",
  "trauma",
];

const BURN_KEYWORDS = [
  "burn",
  "burns",
  "scalded",
  "scald",
  "fire",
  "chemical burn",
  "electrocution",
  "first degree burn",
  "second degree burn",
  "third degree burn",
];

const PEDIATRIC_KEYWORDS = [
  "child",
  "baby",
  "infant",
  "toddler",
  "newborn",
  "pediatric",
  "kid",
  "boy",
  "girl",
  "year old child",
  "month old",
];

const NEURO_KEYWORDS = [
  "head injury",
  "head trauma",
  "concussion",
  "stroke",
  "seizure",
  "convulsion",
  "brain",
  "unconscious",
  "unresponsive",
  "slurred speech",
  "facial droop",
  "paralysis",
  "numbness",
  "neurological",
];

// ---------------------------------------------------------------------------
// Equipment recommendations per specialization
// ---------------------------------------------------------------------------

const EQUIPMENT_MAP: Record<Specialization, string[]> = {
  Cardiac: [
    "Defibrillator (AED)",
    "12-Lead ECG Monitor",
    "Nitroglycerin",
    "Aspirin",
    "IV Access Kit",
    "Oxygen Supply",
  ],
  Trauma: [
    "Trauma Kit",
    "Tourniquet",
    "Cervical Collar",
    "Spinal Board",
    "IV Access Kit",
    "Blood Pressure Monitor",
    "Oxygen Supply",
  ],
  Burns: [
    "Burn Dressing Kit",
    "Sterile Saline",
    "Pain Management Kit",
    "IV Access Kit",
    "Oxygen Supply",
    "Thermal Blanket",
  ],
  Pediatric: [
    "Pediatric Airway Kit",
    "Pediatric IV Kit",
    "Broselow Tape",
    "Pediatric Medications",
    "Oxygen Supply",
    "Infant Pulse Oximeter",
  ],
  Neuro: [
    "Cervical Collar",
    "Spinal Board",
    "Pupil Light",
    "GCS Assessment Kit",
    "IV Access Kit",
    "Oxygen Supply",
    "Blood Glucose Monitor",
  ],
  General: [
    "First Aid Kit",
    "IV Access Kit",
    "Oxygen Supply",
    "Blood Pressure Monitor",
    "Pulse Oximeter",
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count how many keywords from a list appear in the text. */
function countMatches(text: string, keywords: string[]): number {
  return keywords.filter((kw) => text.includes(kw)).length;
}

/** Return every matched keyword from a list. */
function getMatches(text: string, keywords: string[]): string[] {
  return keywords.filter((kw) => text.includes(kw));
}

// ---------------------------------------------------------------------------
// Severity classification
// ---------------------------------------------------------------------------

function classifySeverity(text: string): {
  severity: SeverityLevel;
  matchedKeywords: string[];
} {
  const p1Matches = getMatches(text, P1_KEYWORDS);
  if (p1Matches.length > 0) {
    return { severity: "P1", matchedKeywords: p1Matches };
  }

  const p2Matches = getMatches(text, P2_KEYWORDS);
  if (p2Matches.length > 0) {
    return { severity: "P2", matchedKeywords: p2Matches };
  }

  const p3Matches = getMatches(text, P3_KEYWORDS);
  if (p3Matches.length > 0) {
    return { severity: "P3", matchedKeywords: p3Matches };
  }

  const p4Matches = getMatches(text, P4_KEYWORDS);
  if (p4Matches.length > 0) {
    return { severity: "P4", matchedKeywords: p4Matches };
  }

  // Default: if nothing matched, treat as P3 (moderate) for safety
  return { severity: "P3", matchedKeywords: [] };
}

// ---------------------------------------------------------------------------
// Specialization classification
// ---------------------------------------------------------------------------

function classifySpecialization(text: string): {
  specialization: Specialization;
  matchedKeywords: string[];
} {
  // Score each specialization by keyword match count and return highest
  const scores: { spec: Specialization; count: number; keywords: string[] }[] =
    [
      {
        spec: "Cardiac",
        count: countMatches(text, CARDIAC_KEYWORDS),
        keywords: getMatches(text, CARDIAC_KEYWORDS),
      },
      {
        spec: "Trauma",
        count: countMatches(text, TRAUMA_KEYWORDS),
        keywords: getMatches(text, TRAUMA_KEYWORDS),
      },
      {
        spec: "Burns",
        count: countMatches(text, BURN_KEYWORDS),
        keywords: getMatches(text, BURN_KEYWORDS),
      },
      {
        spec: "Pediatric",
        count: countMatches(text, PEDIATRIC_KEYWORDS),
        keywords: getMatches(text, PEDIATRIC_KEYWORDS),
      },
      {
        spec: "Neuro",
        count: countMatches(text, NEURO_KEYWORDS),
        keywords: getMatches(text, NEURO_KEYWORDS),
      },
    ];

  // Sort descending by count
  scores.sort((a, b) => b.count - a.count);

  if (scores[0].count > 0) {
    return {
      specialization: scores[0].spec,
      matchedKeywords: scores[0].keywords,
    };
  }

  return { specialization: "General", matchedKeywords: [] };
}

// ---------------------------------------------------------------------------
// Urgency score calculation
// ---------------------------------------------------------------------------

function calculateUrgencyScore(
  severity: SeverityLevel,
  keywordCount: number
): number {
  const baseScores: Record<SeverityLevel, number> = {
    P1: 85,
    P2: 65,
    P3: 40,
    P4: 15,
  };

  const base = baseScores[severity];
  // More keyword matches within a severity band push the score higher,
  // capped at 100
  const bonus = Math.min(keywordCount * 3, 15);
  return Math.min(base + bonus, 100);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Classify an emergency description into a triage result with severity,
 * specialization, urgency score, recommended equipment, and reasoning.
 */
export function triageEmergency(description: string): TriageResult {
  const text = description.toLowerCase().trim();

  const { severity, matchedKeywords: severityKeywords } =
    classifySeverity(text);
  const { specialization, matchedKeywords: specKeywords } =
    classifySpecialization(text);

  const allMatchedKeywords = [
    ...new Set([...severityKeywords, ...specKeywords]),
  ];

  const urgencyScore = calculateUrgencyScore(
    severity,
    allMatchedKeywords.length
  );

  const recommendedEquipment = EQUIPMENT_MAP[specialization];

  // Build human-readable reasoning
  const severityLabels: Record<SeverityLevel, string> = {
    P1: "Critical",
    P2: "Urgent",
    P3: "Moderate",
    P4: "Minor",
  };

  let reasoning: string;
  if (allMatchedKeywords.length > 0) {
    reasoning =
      `Classified as ${severityLabels[severity]} (${severity}) based on keywords: ` +
      `${allMatchedKeywords.map((k) => `"${k}"`).join(", ")}. ` +
      `Specialization set to ${specialization}. ` +
      `Urgency score: ${urgencyScore}/100.`;
  } else {
    reasoning =
      `No specific keywords matched in the description. ` +
      `Defaulting to ${severityLabels[severity]} (${severity}) with ${specialization} specialization ` +
      `as a precautionary measure. Urgency score: ${urgencyScore}/100.`;
  }

  return {
    severity,
    specialization,
    reasoning,
    urgencyScore,
    recommendedEquipment,
  };
}

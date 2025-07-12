// List of mystery quests with difficulty levels and point rewards
export interface MysteryQuest {
  id: number;
  text: string;
  points: number;
  difficulty: '🟢' | '🟡' | '🔴';
}

export const MYSTERY_QUESTS: MysteryQuest[] = [
  { id: 1, text: '10 tiefe Atemzüge mit Fokus auf die Nasenflügel', points: 2, difficulty: '🟢' },
  { id: 2, text: '2 Minuten Plank halten', points: 5, difficulty: '🟡' },
  { id: 3, text: '15 Push-Ups in guter Form', points: 6, difficulty: '🟡' },
  { id: 4, text: '30 Sek kalte Dusche, stoisch bleiben', points: 7, difficulty: '🔴' },
  { id: 5, text: '1000 Schritte barfuß (wenn möglich)', points: 4, difficulty: '🟡' },
  { id: 6, text: '5 Min Körper-Scan-Meditation', points: 4, difficulty: '🟢' },
  { id: 7, text: '10 Min Schulter-/Rücken-Mobility', points: 5, difficulty: '🟡' },
  { id: 8, text: '3 Min Visualisierung: „Der Mann, der ich werde"', points: 4, difficulty: '🟢' },
  { id: 9, text: 'Notiere: Was lief heute ruhig & stark? (3 Dinge)', points: 3, difficulty: '🟢' },
  { id: 10, text: '5 Min draußen sitzen & nichts tun', points: 3, difficulty: '🟢' },
  { id: 11, text: '10 Seiten Buch lesen', points: 5, difficulty: '🟡' },
  { id: 12, text: '3 Min: "Ich bin bereit für mein Leben" sagen', points: 2, difficulty: '🟢' },
  { id: 13, text: '1 Zimmer bewusst aufräumen', points: 4, difficulty: '🟡' },
  { id: 14, text: '10 tiefe Squats + Brust öffnen', points: 3, difficulty: '🟢' },
  { id: 15, text: '1 Text von dir selbst laut vorlesen', points: 4, difficulty: '🟡' },
  { id: 16, text: 'Fenster auf + 5 Min Licht reinlassen', points: 2, difficulty: '🟢' },
  { id: 17, text: '1 Song laut mitsingen/tanzen', points: 3, difficulty: '🟢' },
  { id: 18, text: '5 Min Journaling: "Was bedeutet Ruhe für mich?"', points: 4, difficulty: '🟡' },
  { id: 19, text: '1 Min Körperspannung wie Statue', points: 3, difficulty: '🟢' },
  { id: 20, text: '1 Nachricht oder E-Mail abschicken, die offen war', points: 4, difficulty: '🟡' },
  { id: 21, text: '1 kurzer Text aus einem Philosophie-Buch laut lesen', points: 3, difficulty: '🟢' },
  { id: 22, text: '1 Voice Memo an Freund: Update oder Dank', points: 4, difficulty: '🟡' },
  { id: 23, text: '5 Min durch Bäume spazieren', points: 3, difficulty: '🟢' },
  { id: 24, text: '3 Fragen an dein zukünftiges Ich (z. B. mit 29)', points: 4, difficulty: '🟡' },
  { id: 25, text: 'Atemzug + Satz: „Ich übernehme Verantwortung"', points: 2, difficulty: '🟢' },
  { id: 26, text: '2 Min Wandstütz oder Handstand-Prep', points: 5, difficulty: '🟡' },
  { id: 27, text: '5 Min ohne Handy draußen sitzen', points: 3, difficulty: '🟢' },
  { id: 28, text: '1 neues eiweißreiches Rezept bookmarken', points: 2, difficulty: '🟢' },
  { id: 29, text: '5 Min MFP oder Ernährungstagebuch pflegen', points: 3, difficulty: '🟢' },
  { id: 30, text: '3 Min Triggerpunkt-Rollout', points: 3, difficulty: '🟢' },
  { id: 31, text: '1 Selfie, auf dem du dich stark findest', points: 3, difficulty: '🟢' },
  { id: 32, text: '3 Min deine Stimme aufnehmen & anhören', points: 3, difficulty: '🟢' },
  { id: 33, text: '3x laut: "Ich mach das für mich" sagen', points: 2, difficulty: '🟢' },
  { id: 34, text: '3 Dinge zuhause verschönern', points: 4, difficulty: '🟡' },
  { id: 35, text: '10 Min Joggen mit Fokus auf Körpergefühl', points: 4, difficulty: '🟡' },
  { id: 36, text: '3 langsame Liegestütze mit Kontrolle', points: 4, difficulty: '🟡' },
  { id: 37, text: '5 Min barfuß & achtsam gehen', points: 3, difficulty: '🟢' },
  { id: 38, text: '1 Freund fragen: "Wie geht\'s dir wirklich?"', points: 4, difficulty: '🟡' },
  { id: 39, text: '3 Story-Ideen für Insta oder Blog aufschreiben', points: 3, difficulty: '🟢' },
  { id: 40, text: '1 Outfit anziehen, in dem du dich stark fühlst', points: 3, difficulty: '🟢' },
  { id: 41, text: '5 Min Spaziergang in Stille', points: 3, difficulty: '🟢' },
  { id: 42, text: '2x „Nein" sagen (z. B. vorm Spiegel)', points: 3, difficulty: '🟢' },
  { id: 43, text: '1 kleine To-Do für künftige Reise erledigen', points: 3, difficulty: '🟢' },
  { id: 44, text: '5 Min Hüftdehnung', points: 3, difficulty: '🟢' },
  { id: 45, text: '3x: „Ich bin ein stabiler Mann" sagen', points: 2, difficulty: '🟢' },
  { id: 46, text: '10 Sek Hände ins kalte Wasser tauchen', points: 3, difficulty: '🟢' },
  { id: 47, text: '1 Mini-Journaleintrag mit: „Ich spüre, dass…"', points: 4, difficulty: '🟡' },
  { id: 48, text: '1 Screenshot oder Chatverlauf löschen, der dich blockiert', points: 3, difficulty: '🟢' },
  { id: 49, text: '3 Zeitlupen-Liegestütze (Stoic Mode)', points: 5, difficulty: '🟡' },
  { id: 50, text: '5 Min ohne Input – keine Musik, kein Handy', points: 3, difficulty: '🟢' },
  { id: 51, text: '10 Min Video-Doku über männliche Stärke schauen', points: 4, difficulty: '🟡' },
  { id: 52, text: '1 Glaubenssatz aufschreiben, den du loslassen willst', points: 4, difficulty: '🟡' },
  { id: 53, text: '3 Min Augen zu + ruhiges Stehen', points: 3, difficulty: '🟢' },
  { id: 54, text: '1 Push-Benachrichtigung deaktivieren', points: 2, difficulty: '🟢' },
  { id: 55, text: '1 Sache aufschreiben, auf die du stolz bist', points: 3, difficulty: '🟢' },
  { id: 56, text: '3x: „Ich bin bereit für die nächste Version von mir"', points: 2, difficulty: '🟢' },
  { id: 57, text: '5 Min Muskelfokus (z. B. Schulter isoliert spüren)', points: 3, difficulty: '🟢' },
  { id: 58, text: '1 App löschen, die dir Energie zieht', points: 3, difficulty: '🟢' },
  { id: 59, text: '3 Min bewusst still sitzen & aufrecht sein', points: 3, difficulty: '🟢' },
  { id: 60, text: '1 Mini-Aufgabe vom Chaos-Zettel abarbeiten', points: 4, difficulty: '🟡' },
];

// Get a random quest for the day
export function getRandomQuest(): MysteryQuest {
  const randomIndex = Math.floor(Math.random() * MYSTERY_QUESTS.length);
  return MYSTERY_QUESTS[randomIndex];
}

// Generate a unique quest for the day based on the date
export function getDailyQuest(dateString?: string): MysteryQuest {
  const today = dateString || new Date().toISOString().split('T')[0];

  // Use the date string to create a deterministic "random" index
  // This ensures the same quest appears for the entire day
  const dateNum = parseInt(today.replace(/-/g, ''), 10);
  const index = dateNum % MYSTERY_QUESTS.length;

  return MYSTERY_QUESTS[index];
}

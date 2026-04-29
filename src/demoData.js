const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0];
const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0];
const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

export const DEMO_HABITS = [
  { id: 1, name: "Meditation", icon: "~", color: "#06b6d4", timeOfDay: "matin", userId: 0 },
  { id: 2, name: "Lecture", icon: "#", color: "#a855f7", timeOfDay: "soir", userId: 0 },
  { id: 3, name: "Exercice", icon: "+", color: "#10b981", timeOfDay: "matin", userId: 0 },
  { id: 4, name: "Eau 2L", icon: "~", color: "#3b82f6", timeOfDay: "journee", userId: 0 },
  { id: 5, name: "No phone 1h", icon: "!", color: "#f43f5e", timeOfDay: "soir", userId: 0 },
];

export const DEMO_COMPLETIONS = [
  // Today
  { id: 1, habitId: 1, date: today, userId: 0 },
  { id: 2, habitId: 3, date: today, userId: 0 },
  { id: 3, habitId: 4, date: today, userId: 0 },
  // Yesterday
  { id: 4, habitId: 1, date: yesterday, userId: 0 },
  { id: 5, habitId: 2, date: yesterday, userId: 0 },
  { id: 6, habitId: 3, date: yesterday, userId: 0 },
  { id: 7, habitId: 4, date: yesterday, userId: 0 },
  { id: 8, habitId: 5, date: yesterday, userId: 0 },
  // 2 days ago
  { id: 9, habitId: 1, date: twoDaysAgo, userId: 0 },
  { id: 10, habitId: 3, date: twoDaysAgo, userId: 0 },
  { id: 11, habitId: 4, date: twoDaysAgo, userId: 0 },
  { id: 12, habitId: 5, date: twoDaysAgo, userId: 0 },
  // 3 days ago
  { id: 13, habitId: 1, date: threeDaysAgo, userId: 0 },
  { id: 14, habitId: 2, date: threeDaysAgo, userId: 0 },
  { id: 15, habitId: 3, date: threeDaysAgo, userId: 0 },
  // 4 days ago
  { id: 16, habitId: 1, date: fourDaysAgo, userId: 0 },
  { id: 17, habitId: 4, date: fourDaysAgo, userId: 0 },
  // 5 days ago
  { id: 18, habitId: 1, date: fiveDaysAgo, userId: 0 },
  { id: 19, habitId: 2, date: fiveDaysAgo, userId: 0 },
  { id: 20, habitId: 3, date: fiveDaysAgo, userId: 0 },
  { id: 21, habitId: 4, date: fiveDaysAgo, userId: 0 },
  // 6 days ago
  { id: 22, habitId: 1, date: sixDaysAgo, userId: 0 },
  { id: 23, habitId: 3, date: sixDaysAgo, userId: 0 },
];

export const DEMO_EXERCISES = [
  { id: 1, name: "Pompes", type: "calisthenics", method: "volume", targetSets: 5, targetReps: 5, userId: 0 },
  { id: 2, name: "Tractions", type: "calisthenics", method: "pr", prGoal: 15, userId: 0 },
  { id: 3, name: "Dips", type: "calisthenics", method: "volume", targetSets: 5, targetReps: 5, userId: 0 },
  { id: 4, name: "Squat", type: "musculation", userId: 0 },
  { id: 5, name: "Developpe couche", type: "musculation", userId: 0 },
];

export const DEMO_EXERCISE_LOGS = [
  // Today
  { id: 1, exerciseId: 1, sets: 4, reps: 8, weight: null, date: today, notes: "Bonne forme", userId: 0 },
  { id: 2, exerciseId: 2, sets: 3, reps: 6, weight: null, date: today, notes: "", userId: 0 },
  // Yesterday
  { id: 3, exerciseId: 4, sets: 4, reps: 8, weight: 80, date: yesterday, notes: "PR squat", userId: 0 },
  { id: 4, exerciseId: 5, sets: 4, reps: 6, weight: 60, date: yesterday, notes: "", userId: 0 },
  // 3 days ago
  { id: 5, exerciseId: 1, sets: 3, reps: 10, weight: null, date: threeDaysAgo, notes: "", userId: 0 },
  { id: 6, exerciseId: 3, sets: 3, reps: 8, weight: null, date: threeDaysAgo, notes: "", userId: 0 },
  // 5 days ago
  { id: 7, exerciseId: 4, sets: 4, reps: 6, weight: 75, date: fiveDaysAgo, notes: "", userId: 0 },
  { id: 8, exerciseId: 2, sets: 3, reps: 5, weight: null, date: fiveDaysAgo, notes: "Difficile", userId: 0 },
];

export const DEMO_SESSIONS = [
  { id: 1, date: today, type: "calisthenics", exercises: ["Pompes", "Tractions"], userId: 0 },
  { id: 2, date: yesterday, type: "musculation", exercises: ["Squat", "Developpe couche"], userId: 0 },
  { id: 3, date: threeDaysAgo, type: "calisthenics", exercises: ["Pompes", "Dips"], userId: 0 },
  { id: 4, date: fiveDaysAgo, type: "musculation", exercises: ["Squat", "Tractions"], userId: 0 },
];

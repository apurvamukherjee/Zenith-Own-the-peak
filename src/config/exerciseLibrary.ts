import type { MuscleGroup } from "../db/types";

type Seed = { name: string; primaryMuscle: MuscleGroup; secondaryMuscles: MuscleGroup[]; equipment: string; cues?: string };

export const EXERCISE_LIBRARY: Seed[] = [
  { name: "Flat Barbell Bench Press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", cues: "Arch back, retract scapulae" },
  { name: "Incline Dumbbell Press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "dumbbell", cues: "30° incline, squeeze at top" },
  { name: "Flat Dumbbell Press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "dumbbell" },
  { name: "Incline Machine Press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "machine" },
  { name: "Cable Fly", primaryMuscle: "chest", secondaryMuscles: [], equipment: "cable", cues: "Slight elbow bend, squeeze" },
  { name: "Pec Deck", primaryMuscle: "chest", secondaryMuscles: [], equipment: "machine" },
  { name: "Dips (Chest)", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "bodyweight", cues: "Lean forward for chest emphasis" },
  { name: "Pull-Up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight" },
  { name: "Lat Pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable" },
  { name: "Close-Grip Lat Pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable" },
  { name: "Barbell Row", primaryMuscle: "back", secondaryMuscles: ["biceps", "traps"], equipment: "barbell" },
  { name: "Chest-Supported Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", cues: "No momentum" },
  { name: "Seated Cable Row", primaryMuscle: "back", secondaryMuscles: ["biceps", "traps"], equipment: "cable" },
  { name: "Machine Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "machine" },
  { name: "Straight-Arm Pulldown", primaryMuscle: "back", secondaryMuscles: [], equipment: "cable", cues: "Feel the lats stretch" },
  { name: "T-Bar Row", primaryMuscle: "back", secondaryMuscles: ["biceps", "traps"], equipment: "barbell" },
  { name: "Overhead Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "barbell" },
  { name: "Seated Dumbbell Shoulder Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell" },
  { name: "Lateral Raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "dumbbell", cues: "Slight forward lean" },
  { name: "Cable Lateral Raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "cable" },
  { name: "Rear-Delt Fly", primaryMuscle: "shoulders", secondaryMuscles: ["traps"], equipment: "dumbbell" },
  { name: "Reverse Pec Deck", primaryMuscle: "shoulders", secondaryMuscles: ["traps"], equipment: "machine" },
  { name: "Face Pull", primaryMuscle: "shoulders", secondaryMuscles: ["traps"], equipment: "cable", cues: "External rotate at top" },
  { name: "Barbell Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell" },
  { name: "Dumbbell Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell" },
  { name: "Incline Dumbbell Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "dumbbell", cues: "Full stretch at bottom" },
  { name: "Hammer Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell" },
  { name: "Cable Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "cable" },
  { name: "Spider Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "Preacher Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "machine" },
  { name: "Triceps Pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable" },
  { name: "Cable Triceps Pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable" },
  { name: "Overhead Triceps Extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "Overhead Cable Extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable" },
  { name: "Skull Crusher", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "barbell" },
  { name: "Close-Grip Bench Press", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "barbell" },
  { name: "Barbell Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "barbell", cues: "Brace core, break at hips" },
  { name: "Leg Press", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "machine" },
  { name: "Leg Extension", primaryMuscle: "quads", secondaryMuscles: [], equipment: "machine" },
  { name: "Bulgarian Split Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell" },
  { name: "Hack Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "machine" },
  { name: "Romanian Deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", cues: "Hinge at hips, soft knees" },
  { name: "Lying Leg Curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "machine" },
  { name: "Seated Leg Curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "machine" },
  { name: "Stiff-Leg Deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell" },
  { name: "Hip Thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", cues: "Squeeze at top, chin tucked" },
  { name: "Cable Pull-Through", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "cable" },
  { name: "Glute Kickback", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "cable" },
  { name: "Standing Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine" },
  { name: "Seated Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine" },
  { name: "Hanging Leg Raise", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight" },
  { name: "Cable Crunch", primaryMuscle: "abs", secondaryMuscles: [], equipment: "cable" },
  { name: "Ab Wheel Rollout", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight" },
  { name: "Barbell Shrug", primaryMuscle: "traps", secondaryMuscles: [], equipment: "barbell" },
  { name: "Dumbbell Shrug", primaryMuscle: "traps", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "Farmer's Walk", primaryMuscle: "traps", secondaryMuscles: ["forearms", "abs"], equipment: "dumbbell" },

  // ---- Expansion pack ----
  // Chest
  { name: "Incline Barbell Bench Press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "barbell", cues: "30–45° incline, tuck elbows" },
  { name: "Decline Barbell Bench Press", primaryMuscle: "chest", secondaryMuscles: ["triceps"], equipment: "barbell" },
  { name: "Machine Chest Press", primaryMuscle: "chest", secondaryMuscles: ["triceps"], equipment: "machine" },
  { name: "High-to-Low Cable Crossover", primaryMuscle: "chest", secondaryMuscles: [], equipment: "cable", cues: "Cross wrists at bottom, squeeze" },
  { name: "Low-to-High Cable Crossover", primaryMuscle: "chest", secondaryMuscles: [], equipment: "cable" },
  { name: "Weighted Push-Up", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "bodyweight", cues: "Plate on upper back" },
  { name: "Deficit Push-Up", primaryMuscle: "chest", secondaryMuscles: ["triceps"], equipment: "bodyweight" },

  // Back
  { name: "Conventional Deadlift", primaryMuscle: "back", secondaryMuscles: ["hamstrings", "glutes", "traps"], equipment: "barbell", cues: "Bar over mid-foot, brace hard" },
  { name: "Sumo Deadlift", primaryMuscle: "back", secondaryMuscles: ["quads", "glutes", "traps"], equipment: "barbell", cues: "Wide stance, chest up" },
  { name: "Trap Bar Deadlift", primaryMuscle: "back", secondaryMuscles: ["quads", "glutes", "traps"], equipment: "barbell" },
  { name: "Rack Pull", primaryMuscle: "back", secondaryMuscles: ["hamstrings", "traps"], equipment: "barbell", cues: "Bar just below the knee" },
  { name: "Chin-Up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", cues: "Supinated grip, full stretch" },
  { name: "Neutral-Grip Pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable" },
  { name: "Single-Arm Dumbbell Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", cues: "Drive elbow to hip" },
  { name: "Meadows Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "barbell", cues: "Landmine setup, one hand" },
  { name: "Pendlay Row", primaryMuscle: "back", secondaryMuscles: ["biceps", "traps"], equipment: "barbell", cues: "Dead-stop each rep on floor" },
  { name: "Kroc Row", primaryMuscle: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "dumbbell", cues: "Heavy, hip-driven" },

  // Shoulders
  { name: "Arnold Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", cues: "Rotate from palms-in to palms-out" },
  { name: "Machine Shoulder Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "machine" },
  { name: "Landmine Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps", "chest"], equipment: "barbell" },
  { name: "Front Raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "Cable Front Raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "cable" },
  { name: "Cable Rear-Delt Fly", primaryMuscle: "shoulders", secondaryMuscles: ["traps"], equipment: "cable" },
  { name: "Handstand Push-Up", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "bodyweight", cues: "Wall-assisted for balance" },

  // Biceps
  { name: "EZ-Bar Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", cues: "Wider = short head, narrower = long head" },
  { name: "Concentration Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "dumbbell", cues: "Elbow braced on inner thigh" },
  { name: "Reverse Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", cues: "Pronated grip, brachialis focus" },
  { name: "21s (Bicep)", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "barbell", cues: "7 bottom-half, 7 top-half, 7 full" },
  { name: "Bayesian Cable Curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "cable", cues: "Behind body, extra stretch" },

  // Triceps
  { name: "Rope Pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", cues: "Spread rope at bottom" },
  { name: "Triceps Kickback", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "JM Press", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "barbell", cues: "Half-bench, half-skull-crusher" },
  { name: "Diamond Push-Up", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "bodyweight" },
  { name: "Bench Dip", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "bodyweight" },
  { name: "Weighted Dip (Triceps)", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "bodyweight", cues: "Torso vertical for tri emphasis" },

  // Quads
  { name: "Front Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "abs"], equipment: "barbell", cues: "Elbows up, upright torso" },
  { name: "Goblet Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell" },
  { name: "Zercher Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "abs"], equipment: "barbell", cues: "Bar in elbow crooks" },
  { name: "Belt Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "machine" },
  { name: "Sissy Squat", primaryMuscle: "quads", secondaryMuscles: [], equipment: "bodyweight", cues: "Knee-dominant, lean back" },
  { name: "Walking Lunge", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell" },
  { name: "Reverse Lunge", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", cues: "Softer on the knees than forward lunges" },
  { name: "Step-Up", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell" },
  { name: "Single-Leg Press", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "machine" },

  // Hamstrings
  { name: "Nordic Curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "bodyweight", cues: "Slow eccentric — brutal" },
  { name: "Glute-Ham Raise", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes"], equipment: "machine" },
  { name: "Good Morning", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", cues: "Hinge — keep spine neutral" },
  { name: "Single-Leg RDL", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes"], equipment: "dumbbell", cues: "Balance drill + hinge" },

  // Glutes
  { name: "B-Stance Hip Thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", cues: "One leg kickstanded" },
  { name: "Single-Leg Hip Thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "bodyweight" },
  { name: "Frog Pump", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "bodyweight", cues: "Soles together, knees out" },
  { name: "Cable Kickback", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "cable" },

  // Calves
  { name: "Donkey Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", cues: "Hinged forward — extra stretch" },
  { name: "Leg-Press Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine" },
  { name: "Single-Leg Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "bodyweight" },

  // Abs
  { name: "Plank", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight", cues: "Ribs down, glutes tight" },
  { name: "Side Plank", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight" },
  { name: "Russian Twist", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight" },
  { name: "Dragon Flag", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight", cues: "Body rigid — full-body iron" },
  { name: "Reverse Crunch", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight" },
  { name: "Cable Woodchopper", primaryMuscle: "abs", secondaryMuscles: [], equipment: "cable" },
  { name: "Dead Bug", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight", cues: "Low back pressed to floor" },
  { name: "Toes-to-Bar", primaryMuscle: "abs", secondaryMuscles: [], equipment: "bodyweight" },

  // Traps + forearms
  { name: "Cable Shrug", primaryMuscle: "traps", secondaryMuscles: [], equipment: "cable" },
  { name: "Behind-the-Back Shrug", primaryMuscle: "traps", secondaryMuscles: [], equipment: "barbell" },
  { name: "Wrist Curl", primaryMuscle: "forearms", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "Reverse Wrist Curl", primaryMuscle: "forearms", secondaryMuscles: [], equipment: "dumbbell" },
  { name: "Dead Hang", primaryMuscle: "forearms", secondaryMuscles: ["back"], equipment: "bodyweight", cues: "Grip endurance" },
  { name: "Plate Pinch", primaryMuscle: "forearms", secondaryMuscles: [], equipment: "bodyweight", cues: "Two plates, smooth sides out" },
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest", back: "Back", shoulders: "Shoulders", biceps: "Biceps",
  triceps: "Triceps", quads: "Quads", hamstrings: "Hamstrings", glutes: "Glutes",
  calves: "Calves", abs: "Abs", forearms: "Forearms", traps: "Traps",
};

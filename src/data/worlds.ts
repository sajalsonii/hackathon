import { WorldNode } from "../types/game";

export const initialWorlds: WorldNode[] = [
  {
    level: "01",
    name: "Syntax Forest",
    focus: "Master broken syntax, unclosed braces, colons, and malformed expressions.",
    status: "complete",
    x: 8,
    y: 68,
    challengesCount: 12,
    completedCount: 12
  },
  {
    level: "02",
    name: "Logic Caverns",
    focus: "Trace branches, loops, off-by-one errors, and conditional failures.",
    status: "current",
    x: 30,
    y: 38,
    challengesCount: 12,
    completedCount: 4
  },
  {
    level: "03",
    name: "Array Ruins",
    focus: "Defeat indexing bugs, mutating predicates, and boundary anomalies.",
    status: "locked",
    x: 53,
    y: 57,
    challengesCount: 12,
    completedCount: 0
  },
  {
    level: "04",
    name: "Runtime City",
    focus: "Stabilize infinite recursion, event queue halts, and memory leaks.",
    status: "locked",
    x: 75,
    y: 27,
    challengesCount: 12,
    completedCount: 0
  },
  {
    level: "05",
    name: "Debug Core",
    focus: "Face advanced zero-day anomalies, null dereferences, and network core corruption.",
    status: "locked",
    x: 91,
    y: 54,
    challengesCount: 12,
    completedCount: 0
  }
];

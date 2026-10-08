import { Challenge } from "../types/game";

export const challenges: Challenge[] = [
  // ==========================================
  // PYTHON CHALLENGES
  // ==========================================
  {
    id: "py-easy-greeting",
    title: "Broken Greeting",
    language: "Python",
    difficulty: "Easy",
    worldId: "01",
    worldName: "Syntax Forest",
    threatClass: "CLASS I",
    threatName: "SYNTAX CORRUPTION",
    bugType: "Missing Colon (:)",
    description: "A terminal greeting node failed to compile. The function header is missing its required termination token.",
    fileName: "broken_greeting.py",
    brokenCode: `def greet(name)
    print("Hello " + name)

greet("Alex")`,
    sampleSolution: `def greet(name):
    print("Hello " + name)

greet("Alex")`,
    hints: [
      "Check line 1: examine the end of the `def greet(name)` line.",
      "In Python, all compound statement headers (like `def`, `if`, `for`) must end with a specific punctuation mark.",
      "Add a colon `:` at the end of line 1: `def greet(name):`"
    ],
    bugDnaCategory: "Syntax",
    xpReward: 150,
    bugLine: 1,
    explanation: "In Python, header statements such as `def`, `if`, `for`, `while`, and `class` must conclude with a colon `:` to introduce their indented code block.",
    validate: (code: string) => {
      // Must have def greet(name): with colon
      const headerMatch = /def\s+greet\s*\(\s*name\s*\)\s*:/m.test(code);
      if (!headerMatch) {
        if (/def\s+greet\s*\(\s*name\s*\)\s*[^:\n]/m.test(code) || /def\s+greet\s*\(\s*name\s*\)\s*$/m.test(code)) {
          return { passed: false, message: "SyntaxError: expected ':' at end of line 1" };
        }
        return { passed: false, message: "Function 'greet(name)' header is malformed." };
      }
      // Must still call greet
      if (!code.includes("print") || !code.includes("greet(")) {
        return { passed: false, message: "Keep the function body and the function invocation intact." };
      }
      return { passed: true, message: "Fix verified! Function compiled successfully.", output: "Hello Alex" };
    }
  },
  {
    id: "py-med-divisor",
    title: "Zero Divisor Shield",
    language: "Python",
    difficulty: "Medium",
    worldId: "02",
    worldName: "Logic Caverns",
    threatClass: "CLASS II",
    threatName: "LOGIC BREACH",
    bugType: "Assignment in Conditional",
    description: "An analytics subroutine crashed before checking for empty datasets. It confuses assignment with equality testing.",
    fileName: "calculate_average.py",
    brokenCode: `def calculate_average(scores):
    if len(scores) = 0:
        return 0
    return sum(scores) / len(scores)

print(calculate_average([80, 95, 100]))`,
    sampleSolution: `def calculate_average(scores):
    if len(scores) == 0:
        return 0
    return sum(scores) / len(scores)

print(calculate_average([80, 95, 100]))`,
    hints: [
      "Inspect the condition inside the `if` statement on line 2.",
      "A single equals sign `=` assigns a value. To check for equality, Python uses `==`.",
      "Change `len(scores) = 0` to `len(scores) == 0` (or `if not scores:`)."
    ],
    bugDnaCategory: "Logic",
    xpReward: 300,
    bugLine: 2,
    explanation: "In Python, `=` is strictly an assignment operator. Conditional equality comparisons require the double equals operator `==`.",
    validate: (code: string) => {
      if (/if\s+len\s*\(\s*scores\s*\)\s*=[^=]/.test(code)) {
        return { passed: false, message: "SyntaxError: invalid syntax. Maybe you meant '==' or ':=' instead of '='?" };
      }
      const hasProperCheck =
        /if\s+len\s*\(\s*scores\s*\)\s*==\s*0/.test(code) ||
        /if\s+not\s+scores/.test(code) ||
        /if\s+len\s*\(\s*scores\s*\)\s*<=\s*0/.test(code);
      if (!hasProperCheck) {
        return { passed: false, message: "Empty scores guard is missing or incorrect." };
      }
      return { passed: true, message: "Fix verified! Guard clause active and average calculated.", output: "91.66666666666667" };
    }
  },
  {
    id: "py-hard-countdown",
    title: "Recursive Countdown Fracture",
    language: "Python",
    difficulty: "Hard",
    worldId: "04",
    worldName: "Runtime City",
    threatClass: "CLASS III",
    threatName: "RUNTIME RECURSION",
    bugType: "Infinite Recursion",
    description: "A propulsion sequencing daemon triggers a RecursionError because the recursive step fails to advance towards the base case.",
    fileName: "countdown_seq.py",
    brokenCode: `def countdown(n):
    if n <= 0:
        print("Blastoff!")
    else:
        print(n)
        countdown(n)

countdown(3)`,
    sampleSolution: `def countdown(n):
    if n <= 0:
        print("Blastoff!")
    else:
        print(n)
        countdown(n - 1)

countdown(3)`,
    hints: [
      "Trace the recursive function call inside the `else` branch on line 6.",
      "Notice the argument passed to `countdown(n)`. Does `n` ever change?",
      "Pass `n - 1` into the recursive step: change `countdown(n)` to `countdown(n - 1)`."
    ],
    bugDnaCategory: "Runtime",
    xpReward: 550,
    bugLine: 6,
    explanation: "Recursive functions must always reduce the problem size toward a terminating base case, otherwise maximum call stack recursion depth is exceeded.",
    validate: (code: string) => {
      if (/countdown\s*\(\s*n\s*\)/.test(code) && !/countdown\s*\(\s*n\s*-\s*1\s*\)/.test(code)) {
        return { passed: false, message: "RecursionError: maximum recursion depth exceeded in countdown(n)." };
      }
      const hasProperStep = /countdown\s*\(\s*n\s*-\s*1\s*\)/.test(code);
      if (!hasProperStep) {
        return { passed: false, message: "The recursive call must decrement n by 1." };
      }
      return { passed: true, message: "Fix verified! Sequence reached terminal base case.", output: "3\n2\n1\nBlastoff!" };
    }
  },

  // ==========================================
  // JAVASCRIPT CHALLENGES
  // ==========================================
  {
    id: "js-easy-syntax",
    title: "Unclosed Matrix Tag",
    language: "JavaScript",
    difficulty: "Easy",
    worldId: "01",
    worldName: "Syntax Forest",
    threatClass: "CLASS I",
    threatName: "SYNTAX ANOMALY",
    bugType: "Unbalanced Parenthesis",
    description: "The defense grid logger failed to execute because a parenthesis was never closed before the statement terminator.",
    fileName: "activate-shield.js",
    brokenCode: `function activateShield(powerLevel) {
  const message = "Shield activated at level " + powerLevel;
  console.log(message;
  return true;
}

activateShield(9000);`,
    sampleSolution: `function activateShield(powerLevel) {
  const message = "Shield activated at level " + powerLevel;
  console.log(message);
  return true;
}

activateShield(9000);`,
    hints: [
      "Check line 3 where `console.log` is called.",
      "The statement begins with an opening parenthesis `(` that is never closed.",
      "Add `)` before the semicolon: `console.log(message);`"
    ],
    bugDnaCategory: "Syntax",
    xpReward: 150,
    bugLine: 3,
    explanation: "Every opening bracket and parenthesis in JavaScript must have an exact matching closing character in the appropriate scope.",
    validate: (code: string) => {
      if (/console\.log\s*\(\s*message\s*;/.test(code)) {
        return { passed: false, message: "SyntaxError: Unexpected token ';'. Missing ')' after argument list." };
      }
      if (!/console\.log\s*\(\s*message\s*\)/.test(code)) {
        return { passed: false, message: "Ensure console.log(message) is properly closed." };
      }
      return { passed: true, message: "Fix verified! Defense matrix shield confirmed online.", output: "Shield activated at level 9000" };
    }
  },
  {
    id: "js-med-bounds",
    title: "The Out of Bounds Error",
    language: "JavaScript",
    difficulty: "Medium",
    worldId: "02",
    worldName: "Logic Caverns",
    threatClass: "CLASS II",
    threatName: "MEMORY BREACH",
    bugType: "Off-by-One Loop",
    description: "A rogue iterator breaches memory limits in Logic Caverns. The loadout sync crashes before completion.",
    fileName: "sync-loadout.js",
    brokenCode: `const inventory = ["blade", "scanner", "shield"];

function syncLoadout(items) {
  const ready = [];

  for (let i = 0; i <= items.length; i++) {
    ready.push(items[i].toUpperCase());
  }

  return ready;
}

console.log(syncLoadout(inventory));`,
    sampleSolution: `const inventory = ["blade", "scanner", "shield"];

function syncLoadout(items) {
  const ready = [];

  for (let i = 0; i < items.length; i++) {
    ready.push(items[i].toUpperCase());
  }

  return ready;
}

console.log(syncLoadout(inventory));`,
    hints: [
      "Check the loop condition inside `syncLoadout`.",
      "In a 0-indexed collection of 3 items, valid indices are 0, 1, and 2. What happens when `i === items.length`?",
      "Change `i <= items.length` to `i < items.length` (or `i < 3`)."
    ],
    bugDnaCategory: "Off-by-One",
    xpReward: 300,
    bugLine: 6,
    explanation: "Array indices start at zero, so the final element resides at index `length - 1`. Iterating up to `<= length` attempts to access `undefined`.",
    validate: (code: string) => {
      if (/i\s*<=\s*items\.length/.test(code)) {
        return { passed: false, message: "TypeError: Cannot read properties of undefined (reading 'toUpperCase') at index 3." };
      }
      const hasFixedLoop =
        /i\s*<\s*items\.length/.test(code) ||
        /i\s*<\s*3/.test(code) ||
        /for\s*\(\s*const\s+\w+\s+of\s+items\s*\)/.test(code);
      if (!hasFixedLoop) {
        return { passed: false, message: "The loop condition must not overrun the array bounds." };
      }
      return { passed: true, message: "Fix verified! All items synchronized cleanly.", output: '["BLADE", "SCANNER", "SHIELD"]' };
    }
  },
  {
    id: "js-hard-filter",
    title: "Corrupted Mutation Filter",
    language: "JavaScript",
    difficulty: "Hard",
    worldId: "03",
    worldName: "Array Ruins",
    threatClass: "CLASS III",
    threatName: "PREDICATE MUTATION",
    bugType: "Assignment in Filter Callback",
    description: "An operative filtering query returns empty results because the callback mutates state with assignment instead of evaluating a boolean.",
    fileName: "active-slayers.js",
    brokenCode: `function getActiveSlayers(slayers) {
  const active = slayers.filter(slayer => {
    slayer.status = "active";
  });
  return active;
}

const team = [
  { name: "Alex", status: "active" },
  { name: "Nova", status: "offline" }
];
console.log(getActiveSlayers(team));`,
    sampleSolution: `function getActiveSlayers(slayers) {
  const active = slayers.filter(slayer => {
    return slayer.status === "active";
  });
  return active;
}

const team = [
  { name: "Alex", status: "active" },
  { name: "Nova", status: "offline" }
];
console.log(getActiveSlayers(team));`,
    hints: [
      "Examine what the callback function inside `.filter()` is doing and returning.",
      "The callback assigns `slayer.status = \"active\"` and returns `undefined` (which is falsy!).",
      "Change it to return a comparison: `return slayer.status === \"active\";` (or `slayer => slayer.status === \"active\"`)."
    ],
    bugDnaCategory: "Arrays",
    xpReward: 550,
    bugLine: 3,
    explanation: "Array `.filter()` expects its callback to return a truthy or falsy boolean value for each item. Assignment `=` within curly braces without a `return` returns `undefined`.",
    validate: (code: string) => {
      if (/slayer\.status\s*=\s*["']active["']/.test(code)) {
        return { passed: false, message: "Warning: Mutation detected. Filter callback assigns rather than testing equality." };
      }
      const validComparison =
        /slayer\.status\s*===?\s*["']active["']/.test(code);
      if (!validComparison) {
        return { passed: false, message: "Filter callback must test if slayer.status equals 'active'." };
      }
      return { passed: true, message: "Fix verified! Filter properly collected active operatives.", output: '[{ name: "Alex", status: "active" }]' };
    }
  },

  // ==========================================
  // JAVA CHALLENGES
  // ==========================================
  {
    id: "java-easy-semicolon",
    title: "Semicolon Void Breach",
    language: "Java",
    difficulty: "Easy",
    worldId: "01",
    worldName: "Syntax Forest",
    threatClass: "CLASS I",
    threatName: "STATEMENT DELIMITER",
    bugType: "Missing Semicolon (;)",
    description: "The core generator fails javac compilation because a variable declaration statement lacks a terminating semicolon.",
    fileName: "EnergyCore.java",
    brokenCode: `public class EnergyCore {
    public static int boostPower(int base) {
        int multiplier = 3
        return base * multiplier;
    }

    public static void main(String[] args) {
        System.out.println(boostPower(10));
    }
}`,
    sampleSolution: `public class EnergyCore {
    public static int boostPower(int base) {
        int multiplier = 3;
        return base * multiplier;
    }

    public static void main(String[] args) {
        System.out.println(boostPower(10));
    }
}`,
    hints: [
      "Examine line 3 inside the `boostPower` method.",
      "In Java, every statement must end with a specific punctuation character.",
      "Add a semicolon `;` to the end of `int multiplier = 3`."
    ],
    bugDnaCategory: "Syntax",
    xpReward: 150,
    bugLine: 3,
    explanation: "In Java, semicolons `;` are mandatory statement terminators that inform the compiler where an instruction ends.",
    validate: (code: string) => {
      if (/int\s+multiplier\s*=\s*3\s*\n/.test(code) || /int\s+multiplier\s*=\s*3\s*[^;\s]/.test(code)) {
        return { passed: false, message: "EnergyCore.java:3: error: ';' expected\n        int multiplier = 3" };
      }
      if (!/int\s+multiplier\s*=\s*3\s*;/.test(code)) {
        return { passed: false, message: "Ensure `int multiplier = 3;` has a terminating semicolon." };
      }
      return { passed: true, message: "Fix verified! Class EnergyCore compiled and executed.", output: "30" };
    }
  },
  {
    id: "java-med-stringeq",
    title: "String Identity Anomaly",
    language: "Java",
    difficulty: "Medium",
    worldId: "02",
    worldName: "Logic Caverns",
    threatClass: "CLASS II",
    threatName: "REFERENCE IDENTITY",
    bugType: "Reference vs Value Equality",
    description: "Security credentials are being rejected even when characters match identically because of reference comparison.",
    fileName: "Gatekeeper.java",
    brokenCode: `public class Gatekeeper {
    public static boolean verifyPasscode(String entered, String expected) {
        if (entered == expected) {
            return true;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(verifyPasscode(new String("SLAYER"), "SLAYER"));
    }
}`,
    sampleSolution: `public class Gatekeeper {
    public static boolean verifyPasscode(String entered, String expected) {
        if (entered.equals(expected)) {
            return true;
        }
        return false;
    }

    public static void main(String[] args) {
        System.out.println(verifyPasscode(new String("SLAYER"), "SLAYER"));
    }
}`,
    hints: [
      "Inspect the comparison `entered == expected` on line 3.",
      "In Java, the `==` operator compares object memory memory addresses, not the text content of two Strings.",
      "Use the `.equals()` method: change `entered == expected` to `entered.equals(expected)`."
    ],
    bugDnaCategory: "Logic",
    xpReward: 300,
    bugLine: 3,
    explanation: "In Java, `==` tests object reference equality. To test whether two distinct String instances contain the same character sequence, always use `.equals()`.",
    validate: (code: string) => {
      if (/entered\s*==\s*expected/.test(code)) {
        return { passed: false, message: "Logic failure: '==' compares object memory addresses. Passed test failed (returned false)." };
      }
      const hasEquals =
        /entered\.equals\s*\(\s*expected\s*\)/.test(code) ||
        /expected\.equals\s*\(\s*entered\s*\)/.test(code) ||
        /entered\.equalsIgnoreCase\s*\(\s*expected\s*\)/.test(code);
      if (!hasEquals) {
        return { passed: false, message: "Use the `.equals()` method to compare String contents in Java." };
      }
      return { passed: true, message: "Fix verified! Gate unlocked. Passcode verified.", output: "true" };
    }
  },
  {
    id: "java-hard-npe",
    title: "Null Pointer Rift",
    language: "Java",
    difficulty: "Hard",
    worldId: "05",
    worldName: "Debug Core",
    threatClass: "CLASS III",
    threatName: "NULL POINTER DEREFERENCE",
    bugType: "Unguarded Null Dereference",
    description: "An array processor explodes with a NullPointerException when unallocated memory slots are encountered.",
    fileName: "LoadoutScanner.java",
    brokenCode: `public class LoadoutScanner {
    public static int countValidItems(String[] inventory) {
        int count = 0;
        for (int i = 0; i < inventory.length; i++) {
            if (inventory[i].length() > 0) {
                count++;
            }
        }
        return count;
    }
}`,
    sampleSolution: `public class LoadoutScanner {
    public static int countValidItems(String[] inventory) {
        int count = 0;
        for (int i = 0; i < inventory.length; i++) {
            if (inventory[i] != null && inventory[i].length() > 0) {
                count++;
            }
        }
        return count;
    }
}`,
    hints: [
      "Look at `inventory[i].length()` inside the loop condition.",
      "What happens if an element in the array is `null`? Calling `.length()` on `null` throws a NullPointerException.",
      "Add a null guard: check `inventory[i] != null && inventory[i].length() > 0` before dereferencing."
    ],
    bugDnaCategory: "Runtime",
    xpReward: 550,
    bugLine: 5,
    explanation: "Always guard against null before calling methods on array elements. Short-circuit evaluation `!= null && ...` prevents NullPointerException.",
    validate: (code: string) => {
      const hasNullCheck =
        /inventory\[i\]\s*!=\s*null\s*&&\s*inventory\[i\]\.length\(\)/.test(code) ||
        /inventory\[i\]\s*!=\s*null/.test(code);
      if (!hasNullCheck) {
        return { passed: false, message: "Exception in thread 'main' java.lang.NullPointerException: Cannot invoke 'String.length()' because 'inventory[i]' is null" };
      }
      return { passed: true, message: "Fix verified! Null safeguard operational.", output: "Safe item count computed." };
    }
  },

  // ==========================================
  // DAILY BUG PROTOCOL
  // ==========================================
  {
    id: "daily-infinite-loop",
    title: "The Infinite Loop Incident",
    language: "JavaScript",
    difficulty: "Medium",
    worldId: "04",
    worldName: "Runtime City",
    threatClass: "SPECIAL EVENT",
    threatName: "RECURSIVE TIME FRACTURE",
    bugType: "Stalled Loop Counter",
    description: "A corrupted worker has trapped Runtime City in a recursive time fracture. The counter variable is never incremented.",
    fileName: "drain-corruption.js",
    brokenCode: `function drainCorruption(sectors) {
  let index = 0;
  const purged = [];

  while (index < sectors.length) {
    purged.push("Purged " + sectors[index]);
    // The sector index is stalled!
  }

  return purged;
}

const sectors = ["Sector 7A", "Sector 7B", "Sector 7C"];
console.log(drainCorruption(sectors));`,
    sampleSolution: `function drainCorruption(sectors) {
  let index = 0;
  const purged = [];

  while (index < sectors.length) {
    purged.push("Purged " + sectors[index]);
    index++;
  }

  return purged;
}

const sectors = ["Sector 7A", "Sector 7B", "Sector 7C"];
console.log(drainCorruption(sectors));`,
    hints: [
      "Check the `while` loop condition and body.",
      "The loop checks `index < sectors.length`, but `index` remains 0 forever, freezing the CPU.",
      "Increment `index` inside the while loop: add `index++;` (or `index += 1;`)."
    ],
    bugDnaCategory: "Loops",
    xpReward: 350,
    bugLine: 5,
    explanation: "A `while` loop requires its continuation variable to make progress toward the termination condition with each iteration, otherwise it causes an infinite execution hang.",
    validate: (code: string) => {
      const incrementsIndex =
        /index\s*\+\+/.test(code) ||
        /\+\+\s*index/.test(code) ||
        /index\s*\+=\s*1/.test(code) ||
        /index\s*=\s*index\s*\+\s*1/.test(code);
      if (!incrementsIndex) {
        return { passed: false, message: "FATAL: Process execution timed out. Infinite loop detected on while (index < sectors.length)." };
      }
      return { passed: true, message: "Fix verified! Daily protocol complete. Infinite fracture sealed.", output: '["Purged Sector 7A", "Purged Sector 7B", "Purged Sector 7C"]' };
    }
  },
  {
    id: "py-easy-quotes",
    title: "Unclosed String Fracture",
    language: "Python",
    difficulty: "Easy",
    worldId: "01",
    worldName: "Syntax Forest",
    threatClass: "CLASS I",
    threatName: "LITERAL LEAK",
    bugType: "EOL While Scanning String Literal",
    description: "An authorization terminal failed to broadcast its status. A string literal was left unclosed before the line ended.",
    fileName: "auth_status.py",
    brokenCode: `def show_status():
    print("STATUS: ACCESS GRANTED)

show_status()`,
    sampleSolution: `def show_status():
    print("STATUS: ACCESS GRANTED")

show_status()`,
    hints: [
      "Examine line 2: check the string inside `print(...)`.",
      "Every string started with a double quote `\"` must terminate with a matching double quote.",
      "Add a closing quote `\"` before the closing parenthesis: `\"STATUS: ACCESS GRANTED\"`"
    ],
    bugDnaCategory: "Syntax",
    xpReward: 150,
    bugLine: 2,
    explanation: "In Python, string literals initiated with a quotation mark must be closed with the identical quote mark before reaching end-of-line.",
    validate: (code: string) => {
      const valid = /print\(\s*["']STATUS:\s*ACCESS\s*GRANTED["']\s*\)/i.test(code);
      if (!valid) {
        return { passed: false, message: "SyntaxError: unterminated string literal in print() call." };
      }
      return { passed: true, message: "Fix verified! String literal sealed successfully.", output: "STATUS: ACCESS GRANTED" };
    }
  },
  {
    id: "py-med-range-step",
    title: "Range Offset Anomaly",
    language: "Python",
    difficulty: "Medium",
    worldId: "02",
    worldName: "Logic Caverns",
    threatClass: "CLASS II",
    threatName: "OFFSET GLITCH",
    bugType: "Off-by-One Loop Bounds",
    description: "An inventory scanner skipped the first item in the manifest due to a misconfigured loop range.",
    fileName: "scan_inventory.py",
    brokenCode: `def count_items(items):
    total = 0
    for i in range(1, len(items)):
        total += items[i]
    return total

print(count_items([10, 20, 30]))`,
    sampleSolution: `def count_items(items):
    total = 0
    for i in range(0, len(items)):
        total += items[i]
    return total

print(count_items([10, 20, 30]))`,
    hints: [
      "Look at the `range(...)` arguments on line 3.",
      "Python sequences are zero-indexed: the first item is at index 0, not index 1.",
      "Change `range(1, len(items))` to `range(0, len(items))` or `range(len(items))`."
    ],
    bugDnaCategory: "Loops",
    xpReward: 300,
    bugLine: 3,
    explanation: "List indexes begin at index 0. Starting a range at 1 skips the initial element `items[0]`.",
    validate: (code: string) => {
      const fixed =
        /for\s+i\s+in\s+range\(\s*0\s*,\s*len\(\s*items\s*\)\s*\)/.test(code) ||
        /for\s+i\s+in\s+range\(\s*len\(\s*items\s*\)\s*\)/.test(code) ||
        /for\s+item\s+in\s+items:/.test(code);
      if (!fixed) {
        return { passed: false, message: "Loop still starts at index 1 and skips items[0]." };
      }
      return { passed: true, message: "Fix verified! Full inventory tallied correctly.", output: "60" };
    }
  },
  {
    id: "js-easy-keyword",
    title: "Keyword Corruption",
    language: "JavaScript",
    difficulty: "Easy",
    worldId: "01",
    worldName: "Syntax Forest",
    threatClass: "CLASS I",
    threatName: "TOKEN SCRAMBLE",
    bugType: "Reserved Keyword Typo",
    description: "A pricing calculate routine failed to parse because a core language keyword was misspelled.",
    fileName: "pricing.js",
    brokenCode: `fucntion calculateTotal(price, tax) {
  return price + tax;
}

console.log(calculateTotal(100, 15));`,
    sampleSolution: `function calculateTotal(price, tax) {
  return price + tax;
}

console.log(calculateTotal(100, 15));`,
    hints: [
      "Look at the first word on line 1.",
      "Notice the spelling of the declaration keyword that defines a function in JavaScript.",
      "Correct `fucntion` to `function`."
    ],
    bugDnaCategory: "Syntax",
    xpReward: 150,
    bugLine: 1,
    explanation: "JavaScript requires the exact spelling of reserved keywords like `function` to compile declarations.",
    validate: (code: string) => {
      if (/fucntion/i.test(code)) {
        return { passed: false, message: "ReferenceError: 'fucntion' is not defined. Check keyword spelling." };
      }
      if (!/function\s+calculateTotal/i.test(code)) {
        return { passed: false, message: "Function declaration is missing or malformed." };
      }
      return { passed: true, message: "Fix verified! Function keyword restored.", output: "115" };
    }
  },
  {
    id: "js-med-accum-reset",
    title: "Accumulator Reset Spike",
    language: "JavaScript",
    difficulty: "Medium",
    worldId: "02",
    worldName: "Logic Caverns",
    threatClass: "CLASS II",
    threatName: "STATE OVERWRITE",
    bugType: "Accumulator Scope Error",
    description: "A score tallying algorithm always reports only the last element's value instead of the sum.",
    fileName: "tally_scores.js",
    brokenCode: `function sumScores(scores) {
  for (let i = 0; i < scores.length; i++) {
    let total = 0;
    total += scores[i];
  }
  return total;
}

console.log(sumScores([10, 25, 15]));`,
    sampleSolution: `function sumScores(scores) {
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    total += scores[i];
  }
  return total;
}

console.log(sumScores([10, 25, 15]));`,
    hints: [
      "Look at where `let total = 0` is declared.",
      "If the accumulator is declared inside the `for` loop body, it resets to 0 on every single loop iteration.",
      "Move `let total = 0;` before the `for` loop so it preserves the running sum."
    ],
    bugDnaCategory: "Logic",
    xpReward: 300,
    bugLine: 3,
    explanation: "Declaring and initializing an accumulator variable inside the loop body reinitializes it on every pass, destroying previous additions.",
    validate: (code: string) => {
      if (/for\s*\(.*\)\s*\{\s*let\s+total\s*=\s*0/m.test(code)) {
        return { passed: false, message: "Logic error: 'total' is still resetting to 0 inside the loop body." };
      }
      if (!/let\s+total\s*=\s*0;?\s*for/m.test(code) && !/var\s+total\s*=\s*0;?\s*for/m.test(code)) {
        return { passed: false, message: "Move accumulator declaration before the loop." };
      }
      return { passed: true, message: "Fix verified! Accumulator accumulates across all iterations.", output: "50" };
    }
  },
  {
    id: "java-easy-case",
    title: "Case-Sensitivity Fracture",
    language: "Java",
    difficulty: "Easy",
    worldId: "01",
    worldName: "Syntax Forest",
    threatClass: "CLASS I",
    threatName: "SYMBOL MISMATCH",
    bugType: "Package/Class Case Mismatch",
    description: "The Java compiler cannot find the output stream class due to lowercased class naming.",
    fileName: "Telemetry.java",
    brokenCode: `public class Telemetry {
    public static void main(String[] args) {
        system.out.println("CORE ONLINE");
    }
}`,
    sampleSolution: `public class Telemetry {
    public static void main(String[] args) {
        System.out.println("CORE ONLINE");
    }
}`,
    hints: [
      "Inspect line 3: look at `system.out.println`.",
      "Java is strictly case-sensitive. Standard library classes like `System` start with an uppercase letter.",
      "Change `system.out.println` to `System.out.println`."
    ],
    bugDnaCategory: "Syntax",
    xpReward: 150,
    bugLine: 3,
    explanation: "In Java, identifiers are case-sensitive. The standard library class `java.lang.System` must be capitalized.",
    validate: (code: string) => {
      if (/system\.out\.println/m.test(code)) {
        return { passed: false, message: "error: package system does not exist. Java classes are case-sensitive." };
      }
      if (!/System\.out\.println/m.test(code)) {
        return { passed: false, message: "Ensure System.out.println(\"CORE ONLINE\"); is intact." };
      }
      return { passed: true, message: "Fix verified! Telemetry stream linked.", output: "CORE ONLINE" };
    }
  },
  {
    id: "java-med-array-bound",
    title: "Array Index Boundary Leak",
    language: "Java",
    difficulty: "Medium",
    worldId: "02",
    worldName: "Logic Caverns",
    threatClass: "CLASS II",
    threatName: "INDEX SURGE",
    bugType: "ArrayIndexOutOfBoundsException",
    description: "A loop iterating through sensor readings overshoots the valid array boundary.",
    fileName: "SensorArray.java",
    brokenCode: `public class SensorArray {
    public static void main(String[] args) {
        int[] readings = {12, 18, 24};
        for (int i = 0; i <= readings.length; i++) {
            System.out.println(readings[i]);
        }
    }
}`,
    sampleSolution: `public class SensorArray {
    public static void main(String[] args) {
        int[] readings = {12, 18, 24};
        for (int i = 0; i < readings.length; i++) {
            System.out.println(readings[i]);
        }
    }
}`,
    hints: [
      "Check the condition inside the `for` loop on line 4: `i <= readings.length`.",
      "An array of length 3 has valid indices 0, 1, and 2. When `i` reaches 3, `readings[3]` throws an exception.",
      "Change `<=` to `<` so the loop stops before reaching `readings.length`."
    ],
    bugDnaCategory: "Off-by-One",
    xpReward: 300,
    bugLine: 4,
    explanation: "Java arrays are zero-indexed up to `length - 1`. Using `<=` reaches an index equal to `length`, throwing `ArrayIndexOutOfBoundsException`.",
    validate: (code: string) => {
      if (/i\s*<=\s*readings\.length/m.test(code)) {
        return { passed: false, message: "Exception in thread 'main' java.lang.ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3" };
      }
      if (!/i\s*<\s*readings\.length/m.test(code)) {
        return { passed: false, message: "Loop condition must be `i < readings.length`." };
      }
      return { passed: true, message: "Fix verified! Sensor array parsed within bounds.", output: "12\n18\n24" };
    }
  }
];

export function getChallenge(language: string, difficulty: string): Challenge {
  const match = challenges.find(
    (c) => c.language === language && c.difficulty === difficulty
  );
  return match || challenges[0];
}

export function getChallengeById(id: string): Challenge {
  return challenges.find((c) => c.id === id) || challenges[0];
}

export function getRandomChallenge(
  language: string,
  difficulty: string,
  playedIds: string[] | string = []
): Challenge {
  const matching = challenges.filter(
    (c) => c.language === language && c.difficulty === difficulty
  );
  if (matching.length === 0) return challenges[0];

  const excludeList = Array.isArray(playedIds)
    ? playedIds
    : playedIds
      ? [playedIds]
      : [];

  const unplayed = matching.filter((c) => !excludeList.includes(c.id));
  const pool = unplayed.length > 0 ? unplayed : matching;

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export function normalizeCodeForComparison(code: string): string {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function createAiChallengeValidator(sampleSolution: string) {
  return (submittedCode: string) => {
    const normSubmitted = normalizeCodeForComparison(submittedCode);
    const normSolution = normalizeCodeForComparison(sampleSolution);

    // 1. Direct match with normalized line endings and trimmed trailing whitespace
    if (normSubmitted === normSolution) {
      return {
        passed: true,
        message: "CRITICAL HIT! Anomaly eliminated. Threat neutralized."
      };
    }

    // 2. Line-by-line comparison ignoring blank lines and leading/trailing indentation differences
    const subLines = normSubmitted
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const solLines = normSolution
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (
      subLines.length === solLines.length &&
      subLines.every((line, index) => line === solLines[index])
    ) {
      return {
        passed: true,
        message: "CRITICAL HIT! Anomaly eliminated. Threat neutralized."
      };
    }

    return {
      passed: false,
      message: "The glitch deflected your fix! Inspect the syntax or logic error."
    };
  };
}

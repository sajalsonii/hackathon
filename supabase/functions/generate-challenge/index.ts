import { createClient } from "npm:@supabase/supabase-js@2";

// CORS headers for secure browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Allowed values for input sanitization (prevents prompt injection)
const ALLOWED_LANGUAGES = ["python", "javascript", "java"] as const;
const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"] as const;
const ALLOWED_BUG_CATEGORIES = [
  "syntax",
  "logic",
  "conditionals",
  "loops",
  "arrays",
  "functions",
  "runtime",
  "off-by-one",
] as const;

type AllowedLanguage = (typeof ALLOWED_LANGUAGES)[number];
type AllowedDifficulty = (typeof ALLOWED_DIFFICULTIES)[number];
type AllowedBugCategory = (typeof ALLOWED_BUG_CATEGORIES)[number];

interface ChallengeRequest {
  language: AllowedLanguage;
  difficulty: AllowedDifficulty;
  bugCategory?: AllowedBugCategory;
  avoidTitles?: string[];
}

interface RawGeminiChallenge {
  title: string;
  language: string;
  difficulty: string;
  bugCategory: string;
  brokenCode: string;
  fixedCode: string;
  bugLine: number;
  creatureName: string;
  missionDescription: string;
  hint1: string;
  hint2: string;
  hint3: string;
  explanation: string;
  whatYouLearned: string;
  xpReward: number;
}

// 35 varied beginner-friendly scenario themes to ensure high randomness
const SCENARIO_THEMES = [
  "shopping cart total calculation",
  "temperature converter (Celsius to Fahrenheit)",
  "game score and high score tracker",
  "password length and security check",
  "student grade average calculator",
  "pizza order itemizer and price summary",
  "countdown timer from seconds to zero",
  "playlist song duration counter",
  "vending machine coin change dispenser",
  "library book checkout duration",
  "bank account deposit and balance checker",
  "parking lot hourly fee calculation",
  "trivia quiz score tally",
  "daily fitness step counter goal check",
  "word or string reverser",
  "even or odd number classifier",
  "roster list of player names filter",
  "smartphone battery level alert",
  "movie ticket price discount by age",
  "fruit basket inventory count",
  "tip calculator for dining bill",
  "speed limit radar warning check",
  "coffee machine cup size selector",
  "dice roll streak aggregator",
  "recipe ingredient quantity scaler",
  "weather forecast rainfall tracker",
  "hotel room reservation night tally",
  "gym workout repetition accumulator",
  "discount coupon code validator",
  "package shipping weight estimator",
  "simple currency exchanger",
  "calendar leap year or days calculator",
  "fuel efficiency miles per gallon calculator",
  "task list completed items counter",
  "elevator floor destination indicator",
] as const;

// Concrete bug styles categorized by bug type
const BUG_STYLES_BY_CATEGORY: Record<AllowedBugCategory, string[]> = {
  syntax: [
    "missing colon ':' at block header (e.g. def, if, for, while)",
    "missing closing parenthesis ')' or bracket ']' or brace '}'",
    "missing closing string quote (single or double quote)",
    "wrong keyword spelling (e.g., 'fucntion', 'whlie', 'retrun', 'ELIF' instead of 'elif')",
    "missing semicolon ';' at statement end in Java",
    "missing or misplaced comma in parameter or list definition",
    "wrong assignment '=' operator in boolean expression",
  ],
  logic: [
    "inverted boolean condition (e.g. '>' instead of '<', or '==' instead of '!=')",
    "wrong arithmetic operator (e.g., '+' instead of '*', or '-' instead of '+')",
    "accidental variable assignment inside conditional branch",
    "returning the wrong variable or calculation result",
    "incorrect accumulator reset (resetting counter inside loop instead of before loop)",
    "wrong order of operations lacking parentheses",
  ],
  conditionals: [
    "flipped comparison operator (e.g. using '<=' when condition requires '>')",
    "using logical OR ('||' or 'or') instead of logical AND ('&&' or 'and')",
    "missing 'else' or fallthrough branch producing unexpected return",
    "checking boundary condition with wrong sign or threshold value",
    "comparing incompatible types or undefined state",
  ],
  loops: [
    "wrong range endpoint (e.g., range(1, n) missing the final number n)",
    "loop condition that never terminates (infinite loop)",
    "wrong increment or decrement step (e.g. i-- instead of i++)",
    "premature loop break or early return inside loop on first iteration",
    "loop counter skipping elements",
  ],
  arrays: [
    "index out of bounds (accessing index length instead of length - 1)",
    "starting index from 1 instead of 0",
    "pushing/appending to array with wrong method or order",
    "iterating array length incorrectly in index lookup",
    "confusing array element value with element index",
  ],
  functions: [
    "missing return statement (returning undefined or None implicitly)",
    "swapped function arguments in call",
    "function parameter name mismatch with local variable",
    "calling function with incorrect argument count",
    "returning before all processing is complete",
  ],
  runtime: [
    "division by zero error when denominator is zero",
    "null pointer / undefined property access on empty object or list",
    "type mismatch in string and number concatenation",
    "calling a method on null or None reference",
    "unhandled empty collection or empty string input",
  ],
  "off-by-one": [
    "using '<=' instead of '<' on zero-indexed collection length",
    "using '<' instead of '<=' when including the upper bound",
    "slice or substring ending 1 character or element too short",
    "fencepost error in fence/step counting loop",
    "off-by-one in string indexing or array boundary",
  ],
};

function getRandomScenarioTheme(): string {
  return SCENARIO_THEMES[Math.floor(Math.random() * SCENARIO_THEMES.length)];
}

function pickBugCategoryAndStyle(
  difficulty: AllowedDifficulty,
  requestedCategory?: AllowedBugCategory
): { category: AllowedBugCategory; style: string } {
  let category: AllowedBugCategory;

  if (requestedCategory) {
    category = requestedCategory;
  } else if (difficulty === "easy") {
    category = "syntax";
  } else if (difficulty === "medium") {
    const mediumPool: AllowedBugCategory[] = [
      "logic",
      "conditionals",
      "loops",
      "arrays",
      "off-by-one",
    ];
    category = mediumPool[Math.floor(Math.random() * mediumPool.length)];
  } else {
    const hardPool: AllowedBugCategory[] = [
      "runtime",
      "functions",
      "logic",
      "arrays",
      "off-by-one",
    ];
    category = hardPool[Math.floor(Math.random() * hardPool.length)];
  }

  const styles = BUG_STYLES_BY_CATEGORY[category] || BUG_STYLES_BY_CATEGORY.syntax;
  const style = styles[Math.floor(Math.random() * styles.length)];

  return { category, style };
}

function generateNonce(): string {
  return (
    Math.random().toString(36).substring(2, 9) +
    "-" +
    Date.now().toString(36)
  );
}

// Maps input bug category to the canonical Bug DNA category casing used in the frontend
function mapDnaCategory(category: string): "Syntax" | "Logic" | "Loops" | "Arrays" | "Functions" | "Runtime" | "Conditionals" | "Off-by-One" {
  const lower = category.toLowerCase().trim();
  if (lower === "syntax") return "Syntax";
  if (lower === "loops") return "Loops";
  if (lower === "arrays") return "Arrays";
  if (lower === "functions") return "Functions";
  if (lower === "runtime") return "Runtime";
  if (lower === "conditionals") return "Conditionals";
  if (lower === "off-by-one") return "Off-by-One";
  return "Logic";
}

// Maps language to proper file extension
function getFileExtension(lang: string): string {
  const l = lang.toLowerCase();
  if (l === "python") return ".py";
  if (l === "java") return ".java";
  return ".js";
}

// Validates the challenge structure and enforces "exactly one bug" rule
function validateGeneratedChallenge(
  item: unknown,
  difficulty: AllowedDifficulty
): { valid: boolean; reason?: string } {
  if (!item || typeof item !== "object") {
    return { valid: false, reason: "Response is not an object" };
  }

  const candidate = item as Record<string, unknown>;
  const requiredFields = [
    "title",
    "language",
    "difficulty",
    "bugCategory",
    "brokenCode",
    "fixedCode",
    "bugLine",
    "creatureName",
    "missionDescription",
    "hint1",
    "hint2",
    "hint3",
    "explanation",
    "whatYouLearned",
    "xpReward",
  ];

  for (const field of requiredFields) {
    if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
      return { valid: false, reason: `Missing or empty field: ${field}` };
    }
  }

  const broken = String(candidate.brokenCode).trim();
  const fixed = String(candidate.fixedCode).trim();

  if (broken === fixed) {
    return { valid: false, reason: "brokenCode is identical to fixedCode" };
  }

  const brokenLines = broken.split("\n");
  const fixedLines = fixed.split("\n");
  const lineCount = brokenLines.length;

  // Verify line counts according to difficulty specification
  if (difficulty === "easy" && (lineCount < 3 || lineCount > 10)) {
    return { valid: false, reason: `Easy challenge line count out of range: ${lineCount}` };
  }
  if (difficulty === "medium" && (lineCount < 6 || lineCount > 14)) {
    return { valid: false, reason: `Medium challenge line count out of range: ${lineCount}` };
  }
  if (difficulty === "hard" && (lineCount < 8 || lineCount > 18)) {
    return { valid: false, reason: `Hard challenge line count out of range: ${lineCount}` };
  }

  // Count lines that differ between broken and fixed code
  let diffCount = 0;
  const maxLen = Math.max(brokenLines.length, fixedLines.length);
  let changedFixedSnippet = "";

  for (let i = 0; i < maxLen; i++) {
    const b = (brokenLines[i] ?? "").trim();
    const f = (fixedLines[i] ?? "").trim();
    if (b !== f) {
      diffCount++;
      if (f.length > changedFixedSnippet.length) {
        changedFixedSnippet = f;
      }
    }
  }

  // Enforce single-bug constraints (1 line for easy, at most 2 for medium/hard)
  const maxAllowedDiff = difficulty === "easy" ? 1 : 2;
  if (diffCount === 0 || diffCount > maxAllowedDiff) {
    return { valid: false, reason: `Differing lines (${diffCount}) exceed limit (${maxAllowedDiff})` };
  }

  // hint3 must NOT give away the full corrected line verbatim
  const hint3 = String(candidate.hint3).toLowerCase();
  if (changedFixedSnippet.length > 5 && hint3.includes(changedFixedSnippet.toLowerCase())) {
    return { valid: false, reason: "hint3 contains the complete fixed line verbatim" };
  }

  return { valid: true };
}

// Build the structured prompt for Gemini
function buildPrompt(params: {
  language: AllowedLanguage;
  difficulty: AllowedDifficulty;
  bugCategory?: AllowedBugCategory;
  chosenTheme: string;
  chosenCategory: AllowedBugCategory;
  chosenStyle: string;
  nonce: string;
  avoidTitles: string[];
}): string {
  const lengthRange =
    params.difficulty === "easy"
      ? "4 to 8 lines"
      : params.difficulty === "medium"
        ? "8 to 12 lines"
        : "10 to 15 lines";

  const xp = params.difficulty === "easy" ? 150 : params.difficulty === "medium" ? 300 : 550;

  const avoidInstruction =
    params.avoidTitles.length > 0
      ? `\nCRITICAL ANTI-REPETITION REQUIREMENT:
Do not reuse these titles, themes or bugs: ${JSON.stringify(params.avoidTitles)}.
You MUST invent a completely different scenario title, different code implementation, and a distinct bug from any in that list.\n`
      : "";

  return `You are the backend challenge generator for Code Slayer, a cyberpunk-themed coding game.
Generate ONE short, unique debugging challenge in ${params.language.toUpperCase()} with difficulty '${params.difficulty.toUpperCase()}'.

MANDATORY RANDOM PARAMETERS:
- Scenario Theme: ${params.chosenTheme}. The code logic MUST be centered on this practical scenario.
- Target Bug Category: '${params.chosenCategory}'.
- Target Concrete Bug Style: ${params.chosenStyle}. The code must contain exactly this specific bug.
- Unique Random Seed Nonce: ${params.nonce}. (Use this nonce to generate novel variable names and distinct logic).
${avoidInstruction}
CRITICAL RULES:
1. Exactly ONE intentional bug. The code must be completely valid and runnable once this single bug is fixed.
2. Beginner-friendly and fair: no trick questions, no esoteric language quirks, no multiple unrelated bugs.
3. Code Length: ${lengthRange}. Keep it concise and clean.
4. Code flavor: Realistic, varied, practical scenarios based on the assigned theme. Do NOT use cyberpunk metaphors inside the actual code variables; keep variable names clear, readable, and realistic.
5. Creature & Theme flavor: The creatureName MUST have a futuristic digital glitch name (e.g., "Syntax Void Leech", "Null Pointer Phantom", "Index OOB Reaver", "Logic Gate Glitch", "Quantum Heap Lurker"). Make it themed around the glitch.
6. missionDescription: Exactly 2 sentences explaining the glitch anomaly without revealing the exact fix.
7. Hints progression:
   - hint1: Conceptual clue only, do not give away line or token.
   - hint2: Narrows down to the affected area or logical flaw.
   - hint3: Very specific guidance on how to fix it, BUT the learner must still make the correction themselves. Under no circumstances include the complete corrected line verbatim.
8. explanation: 1-2 clear sentences explaining why the bug occurs.
9. whatYouLearned: Exactly one clear sentence summarizing the key takeaway.
10. xpReward: Exactly ${xp}.
11. Genuinely unique and meaningfully different: Generate meaningfully different coding debugging problems. Do not repeat any previously used problem, code structure, bug scenario, or merely rename variables from an existing problem. Design distinct program logic tailored specifically to '${params.chosenTheme}'.

Ensure brokenCode differs from fixedCode by only 1 line (for easy) or at most 2 lines (for medium/hard).`;
}

// JSON schema for Gemini structured output
const challengeResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    language: { type: "STRING" },
    difficulty: { type: "STRING" },
    bugCategory: { type: "STRING" },
    brokenCode: { type: "STRING" },
    fixedCode: { type: "STRING" },
    bugLine: { type: "INTEGER" },
    creatureName: { type: "STRING" },
    missionDescription: { type: "STRING" },
    hint1: { type: "STRING" },
    hint2: { type: "STRING" },
    hint3: { type: "STRING" },
    explanation: { type: "STRING" },
    whatYouLearned: { type: "STRING" },
    xpReward: { type: "INTEGER" },
  },
  required: [
    "title",
    "language",
    "difficulty",
    "bugCategory",
    "brokenCode",
    "fixedCode",
    "bugLine",
    "creatureName",
    "missionDescription",
    "hint1",
    "hint2",
    "hint3",
    "explanation",
    "whatYouLearned",
    "xpReward",
  ],
};

// Request challenge from Gemini API with timeout and elevated temperature for maximum variety
async function callGemini(
  prompt: string,
  apiKey: string,
  model: string,
  timeoutMs = 10000
): Promise<{ success: boolean; data?: RawGeminiChallenge; errorType?: "TIMEOUT" | "API_ERROR" | "PARSE_ERROR" }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          responseMimeType: "application/json",
          responseSchema: challengeResponseSchema,
        },
      }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { success: false, errorType: "API_ERROR" };
    }

    const json = await res.json();
    const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return { success: false, errorType: "PARSE_ERROR" };
    }

    const parsed: RawGeminiChallenge = JSON.parse(candidateText);
    return { success: true, data: parsed };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted"))) {
      return { success: false, errorType: "TIMEOUT" };
    }
    return { success: false, errorType: "API_ERROR" };
  }
}

// Edge Function Request Handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Enforce POST method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "METHOD_NOT_ALLOWED", message: "Only POST requests are allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 1. Authenticate user: Verify JWT presence
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "UNAUTHORIZED", message: "Authorization token required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify token with Supabase Auth if credentials are available in environment
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or expired session token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "Failed to verify session token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // 2. Validate Gemini API Key secret
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    return new Response(
      JSON.stringify({
        error: "CONFIGURATION_ERROR",
        message: "Server configuration missing: GEMINI_API_KEY secret is not set.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Gemini model with safe Flash default
  const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";

  // 3. Parse and strictly validate input JSON body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "INVALID_JSON", message: "Request body must be valid JSON" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rawLanguage = String(body.language || "").toLowerCase().trim();
  const rawDifficulty = String(body.difficulty || "").toLowerCase().trim();
  const rawBugCategory = body.bugCategory
    ? String(body.bugCategory).toLowerCase().trim()
    : undefined;

  if (!ALLOWED_LANGUAGES.includes(rawLanguage as AllowedLanguage)) {
    return new Response(
      JSON.stringify({
        error: "INVALID_INPUT",
        message: `Invalid language '${body.language}'. Allowed: ${ALLOWED_LANGUAGES.join(", ")}`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!ALLOWED_DIFFICULTIES.includes(rawDifficulty as AllowedDifficulty)) {
    return new Response(
      JSON.stringify({
        error: "INVALID_INPUT",
        message: `Invalid difficulty '${body.difficulty}'. Allowed: ${ALLOWED_DIFFICULTIES.join(", ")}`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (rawBugCategory && !ALLOWED_BUG_CATEGORIES.includes(rawBugCategory as AllowedBugCategory)) {
    return new Response(
      JSON.stringify({
        error: "INVALID_INPUT",
        message: `Invalid bugCategory '${body.bugCategory}'. Allowed: ${ALLOWED_BUG_CATEGORIES.join(", ")}`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate optional avoidTitles (array of up to 8 strings, each max 80 chars trimmed)
  let avoidTitles: string[] = [];
  if (body.avoidTitles !== undefined && body.avoidTitles !== null) {
    if (Array.isArray(body.avoidTitles)) {
      avoidTitles = body.avoidTitles
        .filter((item): item is string => typeof item === "string")
        .map((s) => s.trim().slice(0, 80))
        .filter((s) => s.length > 0)
        .slice(0, 8);
    }
  }

  const sanitizedReq: ChallengeRequest = {
    language: rawLanguage as AllowedLanguage,
    difficulty: rawDifficulty as AllowedDifficulty,
    bugCategory: rawBugCategory as AllowedBugCategory | undefined,
    avoidTitles,
  };

  // 4. Call Gemini with retry (try up to 2 times with fresh randomized parameters)
  let challengeResult: RawGeminiChallenge | null = null;
  let lastErrorType: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    // Generate fresh theme, bug category, style, and nonce for EACH attempt
    const chosenTheme = getRandomScenarioTheme();
    const { category: chosenCategory, style: chosenStyle } = pickBugCategoryAndStyle(
      sanitizedReq.difficulty,
      sanitizedReq.bugCategory
    );
    const nonce = generateNonce();

    const prompt = buildPrompt({
      language: sanitizedReq.language,
      difficulty: sanitizedReq.difficulty,
      bugCategory: sanitizedReq.bugCategory,
      chosenTheme,
      chosenCategory,
      chosenStyle,
      nonce,
      avoidTitles,
    });

    const outcome = await callGemini(prompt, geminiApiKey, geminiModel, 10000);

    if (outcome.success && outcome.data) {
      const validation = validateGeneratedChallenge(outcome.data, sanitizedReq.difficulty);
      if (validation.valid) {
        // Server-side check: if returned title or brokenCode is identical to any avoidTitles entry (case-insensitive), retry once
        const returnedTitle = String(outcome.data.title || "").trim().toLowerCase();
        const returnedCode = String(outcome.data.brokenCode || "").trim().toLowerCase();

        const isDuplicateTitle = avoidTitles.some(
          (t) => t.trim().toLowerCase() === returnedTitle
        );
        const isDuplicateCode = avoidTitles.some(
          (t) => t.trim().toLowerCase() === returnedCode
        );

        if (isDuplicateTitle || isDuplicateCode) {
          // Retry once on collision
          continue;
        }

        challengeResult = outcome.data;
        break;
      }
    } else if (outcome.errorType === "TIMEOUT") {
      lastErrorType = "TIMEOUT";
    }
  }

  // Handle failure / timeout
  if (!challengeResult) {
    if (lastErrorType === "TIMEOUT") {
      return new Response(
        JSON.stringify({ error: "TIMEOUT", message: "Challenge generation timed out" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "GENERATION_FAILED", message: "Failed to generate a valid challenge" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 5. Format output to match existing Challenge interface expected by the game
  const langTitleCase =
    sanitizedReq.language === "python"
      ? "Python"
      : sanitizedReq.language === "javascript"
        ? "JavaScript"
        : "Java";

  const diffTitleCase =
    sanitizedReq.difficulty === "easy"
      ? "Easy"
      : sanitizedReq.difficulty === "medium"
        ? "Medium"
        : "Hard";

  const worldId =
    sanitizedReq.difficulty === "easy"
      ? "01"
      : sanitizedReq.difficulty === "medium"
        ? "02"
        : "03";

  const worldName =
    sanitizedReq.difficulty === "easy"
      ? "Syntax Forest"
      : sanitizedReq.difficulty === "medium"
        ? "Logic Caverns"
        : "Runtime Abyss";

  const threatClass =
    sanitizedReq.difficulty === "easy"
      ? "CLASS I"
      : sanitizedReq.difficulty === "medium"
        ? "CLASS II"
        : "CLASS III";

  const fileExt = getFileExtension(sanitizedReq.language);
  const slugTitle = challengeResult.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const fileName = `${slugTitle}${fileExt}`;

  const xpReward =
    sanitizedReq.difficulty === "easy"
      ? 150
      : sanitizedReq.difficulty === "medium"
        ? 300
        : 550;

  const challengeId = `ai-${sanitizedReq.language.slice(0, 2)}-${Date.now()}`;

  const responsePayload = {
    // Standard frontend Challenge interface fields
    id: challengeId,
    title: challengeResult.title,
    language: langTitleCase,
    difficulty: diffTitleCase,
    worldId,
    worldName,
    threatClass,
    threatName: challengeResult.creatureName.toUpperCase(),
    bugType: challengeResult.bugCategory,
    description: challengeResult.missionDescription,
    fileName,
    brokenCode: challengeResult.brokenCode,
    sampleSolution: challengeResult.fixedCode,
    hints: [challengeResult.hint1, challengeResult.hint2, challengeResult.hint3] as [string, string, string],
    bugDnaCategory: mapDnaCategory(challengeResult.bugCategory),
    xpReward,
    explanation: challengeResult.explanation,

    // Supplementary metadata fields
    creatureName: challengeResult.creatureName,
    missionDescription: challengeResult.missionDescription,
    fixedCode: challengeResult.fixedCode,
    bugLine: challengeResult.bugLine,
    whatYouLearned: challengeResult.whatYouLearned,
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

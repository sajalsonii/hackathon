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
function buildPrompt(req: ChallengeRequest): string {
  const bugCategoryInstruction = req.bugCategory
    ? `The bug MUST be strictly in the '${req.bugCategory}' category.`
    : req.difficulty === "easy"
      ? "The bug must be a syntax bug (e.g., missing punctuation, unbalanced brackets, typo in keyword)."
      : req.difficulty === "medium"
        ? "The bug must be a logic, conditional, loop, array, or off-by-one bug."
        : "The bug must be a runtime exception, subtle data flow, or function signature bug.";

  const lengthRange =
    req.difficulty === "easy"
      ? "4 to 8 lines"
      : req.difficulty === "medium"
        ? "8 to 12 lines"
        : "10 to 15 lines";

  const xp = req.difficulty === "easy" ? 150 : req.difficulty === "medium" ? 300 : 550;

  return `You are the backend challenge generator for Code Slayer, a cyberpunk-themed coding game.
Generate ONE short debugging challenge in ${req.language.toUpperCase()} with difficulty '${req.difficulty.toUpperCase()}'.

CRITICAL RULES:
1. Exactly ONE intentional bug. The code must be completely valid and runnable once this single bug is fixed.
2. Beginner-friendly and fair: no trick questions, no esoteric language quirks, no multiple unrelated bugs.
3. Code Length: ${lengthRange}. Keep it concise and clean.
4. ${bugCategoryInstruction}
5. Code flavor: Realistic, varied, practical scenarios (algorithms, data filtering, inventory counters, score trackers, math calculations). Do NOT use cyberpunk metaphors inside the actual code variables; keep variable names clear and realistic.
6. Creature & Theme flavor: The creatureName MUST have a futuristic digital glitch name (e.g., "Syntax Void Leech", "Null Pointer Phantom", "Index OOB Reaver", "Logic Gate Glitch").
7. missionDescription: Exactly 2 sentences explaining the glitch anomaly without revealing the exact fix.
8. Hints progression:
   - hint1: Conceptual clue only, do not give away line or token.
   - hint2: Narrows down to the affected area or logical flaw.
   - hint3: Very specific guidance on how to fix it, BUT the learner must still make the correction themselves. Under no circumstances include the complete corrected line verbatim.
9. explanation: 1-2 clear sentences explaining why the bug occurs.
10. whatYouLearned: Exactly one clear sentence summarizing the key takeaway.
11. xpReward: Exactly ${xp}.

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

// Request challenge from Gemini API with timeout
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
          temperature: 0.4,
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

  const sanitizedReq: ChallengeRequest = {
    language: rawLanguage as AllowedLanguage,
    difficulty: rawDifficulty as AllowedDifficulty,
    bugCategory: rawBugCategory as AllowedBugCategory | undefined,
  };

  const prompt = buildPrompt(sanitizedReq);

  // 4. Call Gemini with retry (try up to 2 times)
  let challengeResult: RawGeminiChallenge | null = null;
  let lastErrorType: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const outcome = await callGemini(prompt, geminiApiKey, geminiModel, 10000);

    if (outcome.success && outcome.data) {
      const validation = validateGeneratedChallenge(outcome.data, sanitizedReq.difficulty);
      if (validation.valid) {
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

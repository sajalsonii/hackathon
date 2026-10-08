import { Challenge } from "../types/game";

export interface ScanResult {
  pulseLevel: number;
  maxPulses: number;
  title: string;
  clue: string;
  source: "scanner" | "gemini_ai";
}

export class DebugScannerService {
  /**
   * Retrieves a progressive hint for the given pulse level (1, 2, or 3).
   * Architecture is designed so that if Gemini API is connected in future iterations,
   * it can synthesize real-time code analysis against the user's specific edits.
   */
  public static async getScanClue(
    challenge: Challenge,
    _currentCode: string,
    pulseLevel: number
  ): Promise<ScanResult> {
    const safePulse = Math.min(Math.max(pulseLevel, 1), 3);
    const clueText = challenge.hints[safePulse - 1] || challenge.hints[0];

    const titles = [
      "PATTERN ANOMALY ISOLATED",
      "SUSPECT BLOCK IDENTIFIED",
      "ROOT CAUSE REVEALED"
    ];

    return {
      pulseLevel: safePulse,
      maxPulses: 3,
      title: titles[safePulse - 1],
      clue: clueText,
      source: "scanner"
    };
  }
}

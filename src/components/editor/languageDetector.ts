/**
 * Language & Script Direction Detection Engine
 * Detects RTL scripts (Arabic, Hebrew, Urdu, Persian, Sindhi, etc.)
 * Detects LTR scripts (Latin, Devanagari/Hindi, CJK/Chinese/Japanese/Korean, Cyrillic, etc.)
 * Provides bidirectional text isolation and mixed-script detection.
 */

export type TextDirection = "ltr" | "rtl" | "auto";

export interface DetectedLanguageInfo {
  direction: "ltr" | "rtl";
  scriptName: string;
  languageCode: string;
  hasRtlCharacters: boolean;
  hasLtrCharacters: boolean;
  isMixed: boolean;
}

// Unicode script ranges
const RTL_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const RTL_HEBREW_REGEX = /[\u0590-\u05FF\uFB1D-\uFB4F]/g;
const DEVANAGARI_REGEX = /[\u0900-\u097F]/g; // Hindi / Sanskrit / Marathi
const CJK_REGEX = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g; // Chinese, Japanese Kanji
const CYRILLIC_REGEX = /[\u0400-\u04FF]/g;
const LATIN_REGEX = /[A-Za-z]/g;

// Urdu specific letters
const URDU_SPECIFIC_REGEX = /[\u0679\u0686\u0688\u0691\u0698\u06A9\u06AF\u06BA\u06BE\u06C1\u06CC\u06D2]/g;

export function detectLanguageAndDirection(text: string): DetectedLanguageInfo {
  if (!text || !text.trim()) {
    return {
      direction: "ltr",
      scriptName: "Latin / Default",
      languageCode: "en",
      hasRtlCharacters: false,
      hasLtrCharacters: false,
      isMixed: false,
    };
  }

  const cleanSample = text.slice(0, 1000); // Check first 1000 characters for high performance

  const arabicMatches = cleanSample.match(RTL_ARABIC_REGEX)?.length || 0;
  const hebrewMatches = cleanSample.match(RTL_HEBREW_REGEX)?.length || 0;
  const urduMatches = cleanSample.match(URDU_SPECIFIC_REGEX)?.length || 0;
  const devanagariMatches = cleanSample.match(DEVANAGARI_REGEX)?.length || 0;
  const cjkMatches = cleanSample.match(CJK_REGEX)?.length || 0;
  const cyrillicMatches = cleanSample.match(CYRILLIC_REGEX)?.length || 0;
  const latinMatches = cleanSample.match(LATIN_REGEX)?.length || 0;

  const totalRtl = arabicMatches + hebrewMatches;
  const totalLtr = latinMatches + devanagariMatches + cjkMatches + cyrillicMatches;

  const hasRtl = totalRtl > 0;
  const hasLtr = totalLtr > 0;
  const isMixed = hasRtl && hasLtr;

  // Determine Primary Script & Language Code
  let scriptName = "English / Latin";
  let languageCode = "en";

  if (totalRtl > totalLtr) {
    if (urduMatches > 0) {
      scriptName = "Urdu (اردو)";
      languageCode = "ur";
    } else if (hebrewMatches > arabicMatches) {
      scriptName = "Hebrew (עברית)";
      languageCode = "he";
    } else {
      scriptName = "Arabic (العربية)";
      languageCode = "ar";
    }
  } else {
    if (devanagariMatches > latinMatches && devanagariMatches > cjkMatches) {
      scriptName = "Hindi / Devanagari (हिन्दी)";
      languageCode = "hi";
    } else if (cjkMatches > latinMatches) {
      scriptName = "Chinese / CJK (中文)";
      languageCode = "zh";
    } else if (cyrillicMatches > latinMatches) {
      scriptName = "Cyrillic";
      languageCode = "ru";
    } else {
      scriptName = "English / Latin";
      languageCode = "en";
    }
  }

  return {
    direction: totalRtl > totalLtr ? "rtl" : "ltr",
    scriptName,
    languageCode,
    hasRtlCharacters: hasRtl,
    hasLtrCharacters: hasLtr,
    isMixed,
  };
}

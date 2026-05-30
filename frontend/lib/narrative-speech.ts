import type { NarrativeSpeaker } from "@/lib/simulation-narrative-parser";

/** Substrings that commonly indicate a female-presenting system voice (English locales). */
const FEMALE_NAME_HINTS =
  /female|woman|zira|samantha|karen|victoria|fiona|susan|veena|joanna|kimberly|emma|amy|aria|jenny|nova|linda|heather|sonia|hazel|sarah|catherine|martha|hannah|olivia|nancy|serena|allison|ava|sara|ivy|joelle|michelle|lisa|leslie|stephanie|kendra|siri|flo/i;

/** Substrings that commonly indicate a male-presenting system voice. */
const MALE_NAME_HINTS =
  /male|man\b|david|mark|daniel|fred|james|george|richard|thomas|tony|brian|arthur|guy|aaron|ryan|tom\b|john\b|paul\b|steve|eric|alex\b|jorge|diego|carlos|google uk english male|microsoft george/i;

function englishFirst(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  return en.length ? en : voices;
}

/**
 * Best-effort voice match for mentor vs peer. Browser support varies; falls back to default.
 */
export function pickNarrativeVoice(speaker: NarrativeSpeaker): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const pool = englishFirst(voices);

  if (speaker === "dolly") {
    const female = pool.find((v) => FEMALE_NAME_HINTS.test(v.name) && !MALE_NAME_HINTS.test(v.name));
    if (female) return female;
    const notMale = pool.find((v) => !MALE_NAME_HINTS.test(v.name));
    return notMale ?? pool[0] ?? null;
  }

  const male = pool.find((v) => MALE_NAME_HINTS.test(v.name) && !FEMALE_NAME_HINTS.test(v.name));
  if (male) return male;
  const notFemale = pool.find((v) => !FEMALE_NAME_HINTS.test(v.name));
  return notFemale ?? pool[0] ?? null;
}

/** Speaks one line with a gendered voice when the OS exposes one. Returns cleanup (cancel + remove listeners). */
export function speakNarrativeLine(text: string, speaker: NarrativeSpeaker): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return () => undefined;
  }
  window.speechSynthesis.cancel();

  const run = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    const voice = pickNarrativeVoice(speaker);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };

  let onReady: (() => void) | null = null;

  if (window.speechSynthesis.getVoices().length === 0) {
    onReady = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onReady!);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      const voice = pickNarrativeVoice(speaker);
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onReady);
  } else {
    run();
  }

  return () => {
    if (onReady) window.speechSynthesis.removeEventListener("voiceschanged", onReady);
    window.speechSynthesis.cancel();
  };
}

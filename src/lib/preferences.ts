import { useCallback, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";

export const LANGUAGE_STORAGE_KEY = "handy-pro.language";
export const SIMPLIFIED_MODE_STORAGE_KEY = "handy-pro.simplified-mode";

const PREFERENCES_EVENT = "handy-pro:preferences-changed";
const LANGUAGES = new Set<Lang>(["ua", "ru", "en"]);

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PREFERENCES_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PREFERENCES_EVENT, onStoreChange);
  };
}

function getLanguageSnapshot(): Lang {
  if (typeof window === "undefined") return "ua";
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.has(value as Lang) ? (value as Lang) : "ua";
  } catch {
    return "ua";
  }
}

function getSimplifiedModeSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIMPLIFIED_MODE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function notifyPreferenceChange(): void {
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

export function isLanguagePreference(value: string): value is Lang {
  return LANGUAGES.has(value as Lang);
}

export function useLanguagePreference(): readonly [Lang, (value: Lang) => void] {
  const language = useSyncExternalStore(subscribe, getLanguageSnapshot, (): Lang => "ua");
  const setLanguage = useCallback((value: Lang) => {
    if (typeof window === "undefined" || !isLanguagePreference(value)) return;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
      notifyPreferenceChange();
    } catch {
      // The validated default remains active if browser storage is unavailable.
    }
  }, []);
  return [language, setLanguage] as const;
}

export function useSimplifiedModePreference(): readonly [boolean, (value: boolean) => void] {
  const simplifiedMode = useSyncExternalStore(subscribe, getSimplifiedModeSnapshot, () => false);
  const setSimplifiedMode = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SIMPLIFIED_MODE_STORAGE_KEY, String(value));
      notifyPreferenceChange();
    } catch {
      // The default remains active if browser storage is unavailable.
    }
  }, []);
  return [simplifiedMode, setSimplifiedMode] as const;
}

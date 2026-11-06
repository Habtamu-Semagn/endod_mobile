import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DICTIONARIES, type Dictionary, type TranslationKey } from "./translations";

export type { TranslationKey, Dictionary } from "./translations";
export type Language = "en" | "am";
export type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "am";
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
  locale: string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);
  const t = useCallback<Translate>(
    (key, values) => {
      const dictionary: Dictionary = DICTIONARIES[language];
      const template = dictionary[key] ?? DICTIONARIES.en[key] ?? String(key);
      return interpolate(template, values);
    },
    [language],
  );
  const value = useMemo<I18nValue>(
    () => ({ language, setLanguage, t, locale: language === "am" ? "am-ET" : "en-US" }),
    [language, setLanguage, t],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

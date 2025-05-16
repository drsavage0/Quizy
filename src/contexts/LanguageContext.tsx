
"use client";

import type { ReactNode } from "react";
import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { translations, TranslationKey } from "@/lib/translations";

export type Language = "en" | "ar" | "es" | "fr" | "hi" | "zh-CN";

export const availableLanguages: { code: Language; name: string, nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  availableLanguages: typeof availableLanguages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    // Optional: Persist language choice in localStorage or detect browser language
    // For now, defaults to 'en'
    const browserLang = navigator.language.toLowerCase();
    const matchedLanguage = availableLanguages.find(
      lang => browserLang.startsWith(lang.code) || (lang.code === 'zh-CN' && browserLang.startsWith('zh'))
    );
    // if (matchedLanguage) {
    //   setLanguageState(matchedLanguage.code);
    // } else if (browserLang.startsWith('ar')) {
    //   setLanguageState('ar');
    // }
  }, []);

  useEffect(() => {
    setDir(language === "ar" ? "rtl" : "ltr");
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey, replacements?: Record<string, string | number>): string => {
      let text = translations[language]?.[key] || translations["en"][key] || key;
      if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
          text = text.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
        });
      }
      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

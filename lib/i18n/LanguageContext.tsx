"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { en } from "./locales/en";
import { ko } from "./locales/ko";

type Language = "en" | "ko";
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, ko };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("ko"); // Default to Korean as per current site content

    useEffect(() => {
        const savedLanguage = localStorage.getItem("language") as Language;
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ko")) {
            setLanguageState(savedLanguage);
        } else {
            // Detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (browserLang === 'en' || browserLang === 'ko') {
                setLanguageState(browserLang as Language);
            }
        }
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("language", lang);
        document.documentElement.lang = lang;
    }, []);

    const t = useCallback(
        (path: string) => {
            const keys = path.split(".");
            let result: any = translations[language];

            for (const key of keys) {
                if (result && result[key] !== undefined) {
                    result = result[key];
                } else {
                    console.warn(`Translation path not found: ${path} for language ${language}`);
                    return path;
                }
            }

            return result;
        },
        [language]
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

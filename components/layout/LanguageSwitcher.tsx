"use client";

import * as React from "react";
import { Check, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useHasMounted } from "@/hooks/use-has-mounted";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const hasMounted = useHasMounted();

    const languages = [
        { code: "en", label: "English", flag: "🇺🇸" },
        { code: "ko", label: "한국어", flag: "🇰🇷" },
    ];

    const currentLang = languages.find((l) => l.code === language) || languages[0];

    if (!hasMounted) {
        return (
            <button className="flex items-center gap-2 rounded-md border border-border/40 bg-background/50 px-2 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors outline-none opacity-50">
                <Globe className="h-3.5 w-3.5 opacity-70" />
                <span>{currentLang.label}</span>
            </button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md border border-border/40 bg-background/50 px-2 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground outline-none">
                    <Globe className="h-3.5 w-3.5 opacity-70" />
                    <span>{currentLang.label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-background/95 backdrop-blur-md">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code as "en" | "ko")}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </div>
                        {language === lang.code && <Check className="h-3.5 w-3.5" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

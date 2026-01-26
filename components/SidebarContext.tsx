"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setCollapsedState] = useState(false);

    // Persist sidebar state in local storage
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setCollapsedState(saved === "true");
        }
    }, []);

    const setCollapsed = (collapsed: boolean) => {
        setCollapsedState(collapsed);
        localStorage.setItem("sidebar-collapsed", String(collapsed));
    };

    const toggleCollapsed = () => {
        setCollapsed(!isCollapsed);
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, setCollapsed, toggleCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}

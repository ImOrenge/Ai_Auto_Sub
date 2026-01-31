import { SidebarProvider } from "@/components/SidebarContext";

export default function AppRouteLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    );
}

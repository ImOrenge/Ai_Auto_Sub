 "use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-10 md:px-10 lg:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

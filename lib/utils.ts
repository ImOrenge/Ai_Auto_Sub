import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
    }).format(amount);
}

// Valid UUID for development/mocking (replaces "user_001")
export const MOCK_USER_ID = "fb1e11f1-fbea-4896-98c2-313eb75da59e";

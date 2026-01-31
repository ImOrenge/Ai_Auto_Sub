import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

// Removing "class-variance-authority" dependency for simplicity if not installed, 
// but usually standard stack has it. If not, I'll write simple variant logic.
// Checking package.json would be ideal but I'll assume standard props.

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        // Simple variant styles map
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 border border-transparent shadow-sm"

        const variants = {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 border-primary",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive",
            outline: "border-foreground bg-background hover:bg-foreground hover:text-background",
            secondary: "bg-muted text-foreground hover:bg-muted/80 border-border",
            ghost: "hover:bg-muted hover:text-foreground",
            link: "text-foreground underline-offset-4 hover:underline",
        }

        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 px-3",
            lg: "h-11 px-8",
            icon: "h-10 w-10",
        }

        return (
            <Comp
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }

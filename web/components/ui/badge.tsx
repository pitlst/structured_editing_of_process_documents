import * as React from "react"

import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: "default" | "secondary" | "destructive" | "outline" }) {
    const variantClasses = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
    }

    return (
        <span
            data-slot="badge"
            data-variant={variant}
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-none px-1.5 py-0.5 text-[10px] font-medium [&_svg]:size-3",
                variantClasses[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }

import React from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "glass-panel relative border border-primary/20",
        className
      )}
      {...props}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />
      
      {children}
    </div>
  );
}

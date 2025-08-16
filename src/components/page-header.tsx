
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4", className)}>
      <h1 className={cn("text-3xl font-bold font-headline tracking-tight text-primary")}>
        {title}
      </h1>
      {children && <div className="flex w-full sm:w-auto items-center gap-2">{children}</div>}
    </div>
  );
}

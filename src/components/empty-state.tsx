import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    to?: string;
    onClick?: () => void;
    variant?: "hero" | "soft" | "outline";
  };
  secondaryAction?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const renderButton = (
    action: EmptyStateProps["primaryAction"] | EmptyStateProps["secondaryAction"],
    variant: "hero" | "soft" | "outline" = "soft",
  ) => {
    if (!action) return null;
    const props = {
      variant,
      size: "sm" as const,
      onClick: action.onClick,
      className: variant === "hero" ? "rounded-xl" : "rounded-xl",
    };
    if (action.to) {
      return (
        <Button asChild {...props}>
          <Link to={action.to}>{action.label}</Link>
        </Button>
      );
    }
    return <Button {...props}>{action.label}</Button>;
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--border)] p-10 text-center bg-white",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sand)]">
        <Icon className="h-6 w-6 text-[var(--clay)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--coffee)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--muted-foreground)] mb-6">{description}</p>}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {renderButton(primaryAction, primaryAction?.variant || "hero")}
        {renderButton(secondaryAction, "soft")}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  className 
}) {
  return (
    <div 
      className={cn(
        "animate-slide-up rounded-xl p-6",
        variant === "default" && "stat-card",
        variant === "primary" && "stat-card-primary",
        variant === "accent" && "stat-card-accent",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium uppercase tracking-wide",
            variant === "default" && "text-muted-foreground",
            variant === "primary" && "text-primary-foreground/80",
            variant === "accent" && "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold mt-2 font-heading",
            variant === "default" && "text-foreground",
            variant === "primary" && "text-primary-foreground",
            variant === "accent" && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              variant === "default" && "text-muted-foreground",
              variant === "primary" && "text-primary-foreground/70",
              variant === "accent" && "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            variant === "default" && "bg-primary/10 text-primary",
            variant === "primary" && "bg-primary-foreground/10 text-primary-foreground",
            variant === "accent" && "bg-primary/10 text-primary"
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

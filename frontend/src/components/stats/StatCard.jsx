import { cn } from "../../lib/utils";

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  className 
}) {
  const variantStyles = {
    default: {
      card: "stat-card",
      title: "text-muted-foreground",
      value: "text-foreground",
      subtitle: "text-muted-foreground",
      icon: "bg-primary/10 text-primary"
    },
    accent: {
      card: "stat-card-accent",
      title: "text-muted-foreground",
      value: "text-foreground",
      subtitle: "text-muted-foreground",
      icon: "bg-primary/10 text-primary"
    },
    primary: {
      card: "stat-card-primary",
      title: "text-primary-foreground/80",
      value: "text-primary-foreground",
      subtitle: "text-primary-foreground/70",
      icon: "bg-primary-foreground/10 text-primary-foreground"
    }
  };

  const styles = variantStyles[variant];

  return (
    <div 
      className={cn(
        "rounded-xl p-6 transition-all",
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-xs font-semibold uppercase tracking-wider mb-2",
            styles.title
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold font-heading",
            styles.value
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1.5",
              styles.subtitle
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            styles.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function GradeInput({ value, onChange, disabled }) {
  const getGradeColor = (grade) => {
    if (grade === null || grade === undefined) return "bg-muted border-border text-muted-foreground";
    if (grade >= 5) return "bg-success/10 border-success text-success font-semibold";
    if (grade >= 4) return "bg-primary/10 border-primary text-primary font-semibold";
    return "bg-destructive/10 border-destructive text-destructive font-semibold";
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      onChange(null);
    } else {
      onChange(parseInt(val));
    }
  };

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      disabled={disabled}
      className={cn(
        "w-16 h-9 rounded-full border-2 text-center text-sm appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
        getGradeColor(value),
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <option value="">-</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
    </select>
  );
}

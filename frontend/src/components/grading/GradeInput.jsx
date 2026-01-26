import { useState } from "react";
import { cn } from "@/lib/utils";

export function GradeInput({ value, onChange, disabled }) {
  const [localValue, setLocalValue] = useState(value?.toString() ?? "");

  const handleChange = (e) => {
    const input = e.target.value;
    
    if (input === "") {
      setLocalValue("");
      onChange(null);
      return;
    }

    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= 6) {
      setLocalValue(input);
      onChange(num);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === null) return "";
    if (grade >= 5) return "bg-success/10 border-success text-success font-semibold";
    if (grade >= 4) return "bg-primary/10 border-primary text-primary font-semibold";
    return "bg-destructive/10 border-destructive text-destructive font-semibold";
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      disabled={disabled}
      placeholder="-"
      maxLength={1}
      className={cn(
        "grade-input",
        getGradeColor(value),
        disabled && "opacity-50 cursor-not-allowed"
      )}
    />
  );
}

import { useState } from "react";
import { cn } from "@/lib/utils";

export function GradeInput({ value, onChange, disabled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value?.toString() ?? "");

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleChange = (e) => {
    const input = e.target.value;
    
    if (input === "") {
      setLocalValue("");
      return;
    }

    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= 6) {
      setLocalValue(input);
      onChange(num);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    setLocalValue(value?.toString() ?? "");
  };

  const getGradeColor = (grade) => {
    if (grade === null || grade === undefined) return "bg-muted border-border text-muted-foreground";
    if (grade >= 5) return "bg-success/10 border-success text-success font-semibold";
    if (grade >= 4) return "bg-primary/10 border-primary text-primary font-semibold";
    return "bg-destructive/10 border-destructive text-destructive font-semibold";
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus
        maxLength={1}
        className="w-12 h-9 text-center rounded-full border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-12 h-9 rounded-full border-2 text-center transition-colors",
        getGradeColor(value),
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {value ?? "-"}
    </button>
  );
}

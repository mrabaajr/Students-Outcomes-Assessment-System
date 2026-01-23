import { Plus, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SOTabs({ outcomes, selectedId, onSelect, onAdd, onDelete }) {
  return (
    <nav className="bg-card border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {outcomes.map((so) => (
              <div key={so.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => onSelect(so.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                    selectedId === so.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card hover:bg-accent text-foreground border-border hover:border-primary/50"
                  )}
                >
                  SO {so.number}
                </button>
                {outcomes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(so.id);
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            
            <Button
              onClick={onAdd}
              variant="outline"
              size="sm"
              className="flex-shrink-0 rounded-full border-2 border-dashed border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add new SO
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

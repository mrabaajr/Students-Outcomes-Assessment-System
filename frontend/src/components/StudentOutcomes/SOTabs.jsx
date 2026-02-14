import { Plus, X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function SOTabs({ outcomes, selectedId, onSelect, onAdd, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-4 flex-wrap">
        <button 
          onClick={() => navigate('/programchair/dashboard')}
          className="flex items-center gap-2 text-[#6B6B6B] hover:text-[#231F20] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>
        
        <div className="h-6 w-px bg-[#E5E7EB]" />
        
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          {outcomes.map((so) => (
            <div key={so.id} className="relative group flex-shrink-0">
              <button
                onClick={() => onSelect(so.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedId === so.id
                    ? "bg-[#FFC20E] text-[#231F20] shadow-sm"
                    : "bg-white hover:bg-[#F5F5F5] text-[#231F20] border border-[#E5E7EB]"
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
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
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
            className="flex-shrink-0 rounded-lg border-2 border-dashed border-[#E5E7EB] text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#231F20] hover:border-primary"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add new SO
          </Button>
        </div>
      </div>
    </div>
  );
}

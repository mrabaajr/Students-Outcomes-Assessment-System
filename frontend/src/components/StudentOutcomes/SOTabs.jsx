import { Plus, X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function SOTabs({ outcomes, selectedId, onSelect, onAdd, onDelete }) {
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/programchair')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {outcomes.map((so) => (
              <div key={so.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => onSelect(so.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                    selectedId === so.id
                      ? "bg-black text-white border-black shadow-md"
                      : "bg-white hover:bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-400"
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
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm"
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
              className="flex-shrink-0 rounded-full border-2 border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

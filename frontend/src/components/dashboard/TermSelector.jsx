import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const terms = [
  { id: '2024-2025-1', label: 'First Semester 2024-2025' },
  { id: '2024-2025-2', label: 'Second Semester 2024-2025' },
  { id: '2023-2024-2', label: 'Second Semester 2023-2024' },
  { id: '2023-2024-1', label: 'First Semester 2023-2024' },
];

const TermSelector = ({ selectedTerm, onTermChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentTerm = terms.find(t => t.id === selectedTerm) || terms[0];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-card hover:shadow-card-hover transition-all"
      >
        <div className="p-2 bg-primary/10 rounded-md">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">Academic Term</p>
          <p className="font-medium text-foreground">{currentTerm.label}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden"
          >
            {terms.map((term) => (
              <button
                key={term.id}
                onClick={() => {
                  onTermChange(term.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${
                  term.id === selectedTerm ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                }`}
              >
                {term.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default TermSelector;

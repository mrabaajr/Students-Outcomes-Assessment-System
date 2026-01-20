import { LogOut, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="bg-header text-header-foreground py-3 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">SO Assessment</h1>
            <p className="text-xs text-primary">T.I.P. ENGINEERING</p>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <span className="flex items-center gap-2 text-primary font-medium">
            <GraduationCap className="w-4 h-4" />
            Student Outcomes
          </span>
        </nav>
        
        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>
    </header>
  );
}

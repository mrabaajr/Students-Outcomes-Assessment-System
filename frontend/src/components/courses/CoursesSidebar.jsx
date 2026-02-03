import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, BookOpen } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { departments, academicYears } from '../../data/mockCoursesData';

const CoursesSidebar = ({ 
  collapsed, 
  onToggle, 
  searchTerm, 
  onSearchChange, 
  selectedDepartment, 
  onDepartmentChange,
  selectedYear,
  onYearChange 
}) => {
  return (
    <aside 
      className={`bg-black text-white border-r border-white/10 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-white">Courses</span>
          </div>
        )}
        
        {/* Search */}
        {!collapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        )}
        {collapsed && (
          <Button variant="ghost" size="icon" className="w-full text-white hover:bg-white/10">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto p-4">
        {!collapsed && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-white/50" />
              <span className="text-sm font-medium text-white">Filters</span>
            </div>

            {/* Department Filter */}
            <div className="mb-4">
              <label className="text-xs font-medium text-white/70 mb-2 block">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="w-full p-2 text-sm bg-white/10 border border-white/20 rounded-md text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-black text-white">{dept}</option>
                ))}
              </select>
            </div>

            {/* Academic Year Filter */}
            <div className="mb-4">
              <label className="text-xs font-medium text-white/70 mb-2 block">
                Academic Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="w-full p-2 text-sm bg-white/10 border border-white/20 rounded-md text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="All Years" className="bg-black text-white">All Years</option>
                {academicYears.map((year) => (
                  <option key={year} value={year} className="bg-black text-white">{year}</option>
                ))}
              </select>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 p-3 bg-primary/20 rounded-lg">
              <p className="text-xs text-white/70 mb-1">Quick Stats</p>
              <p className="text-lg font-bold text-white">6 Courses</p>
              <p className="text-xs text-white/70">5 Active, 1 Inactive</p>
            </div>
          </>
        )}
      </div>

      {/* Collapse Button */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 text-white hover:bg-white/10"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
};

export default CoursesSidebar;

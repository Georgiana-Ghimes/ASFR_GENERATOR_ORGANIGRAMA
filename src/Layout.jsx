import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { apiClient } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import logo from '@/assets/ASFR-emboss.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Users,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Layers,
  FileDown,
} from 'lucide-react';

const navigation = [
  { name: 'Organigramă codificare', href: 'OrgChart', icon: Building2 },
  { name: 'Organigramă la anexa OMTI', href: 'OrgChartOMTI', icon: Building2 },
  { name: 'Unități Organizaționale', href: 'Units', icon: Layers },
  // { name: 'Angajați', href: 'Employees', icon: Users },
  { name: 'Versiuni', href: 'Versions', icon: History },
  { name: 'Setări', href: 'Settings', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to={createPageUrl('OrgChart')} className="flex items-center gap-2">
              <img src={logo} alt="ASFR Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-gray-900">ASFR - Organigrama</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )} />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-blue-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Documentation download */}
          <div className="px-4 pb-2">
            <a
              href="/Ghid_Utilizare.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <FileDown className="w-5 h-5 text-gray-400" />
              Descarcă documentația
            </a>
          </div>

          {/* User section */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {user?.role || 'utilizator'}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Deconectare
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 ml-3">
            <img src={logo} alt="ASFR Logo" className="w-5 h-5 object-contain" />
            <span className="font-bold">ASFR - Organigrama</span>
          </div>
        </header>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
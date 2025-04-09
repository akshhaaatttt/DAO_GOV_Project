
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const navItems = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Proposals', href: '/proposals', icon: <FileText className="w-5 h-5" /> },
  { label: 'Create Proposal', href: '/create-proposal', icon: <Plus className="w-5 h-5" /> },
  { label: 'Members', href: '/members', icon: <Users className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar, closeSidebar }) => {
  const location = useLocation();

  // Close sidebar on route change (especially useful for mobile)
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <>
      {/* Overlay (click to close) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - now visible only on mobile */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar/90 backdrop-blur-md border-r border-sidebar-border transform transition-transform duration-300 ease-in-out pt-16 md:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h2 
              className="text-xl font-bold"
              style={{ color: '#723480' }}
            >
              Stellar DAO Hub
            </h2>
            <p 
              className="text-sm mt-1"
              style={{ color: '#723480' }}
            >
              Decentralized Governance
            </p>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm',
                  location.pathname === item.href
                    ? 'shadow-sidebar-accent/25'
                    : 'hover:shadow-md'
                )}
                style={{
                  backgroundColor: location.pathname === item.href ? 'rgba(114, 52, 128, 0.2)' : 'transparent',
                  color: '#723480'
                }}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="bg-sidebar-accent/20 p-3 rounded-md shadow-inner hover:bg-sidebar-accent/30 transition-colors">
              <h3 
                className="text-sm font-medium"
                style={{ color: '#723480' }}
              >
                Contract Address
              </h3>
              <p 
                className="text-xs font-mono break-all bg-sidebar-accent/10 p-2 rounded-md"
                style={{ color: '#723480' }}
              >
                CBWMMKKCMBG6NNWHUQWTNQQBEQVLNH7FA5TBZOLREH7GQ26XUTDVS3CJ
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

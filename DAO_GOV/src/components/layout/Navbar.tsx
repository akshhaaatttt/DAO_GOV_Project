
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, LayoutDashboard, FileText, Plus, Users, Settings } from 'lucide-react';
import { useWallet } from '@/lib/context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';

type NavbarProps = {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
};

const navItems = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Proposals', href: '/proposals', icon: <FileText className="w-5 h-5" /> },
  { label: 'Create Proposal', href: '/create-proposal', icon: <Plus className="w-5 h-5" /> },
  { label: 'Members', href: '/members', icon: <Users className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { isWalletConnected, publicKey, connectWallet, disconnectWallet, isLoading } = useWallet();
  const location = useLocation();
  const { toast } = useToast();

  const formatPublicKey = (publicKey: string) => {
    if (!publicKey) return '';
    return `${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`;
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection failed',
        description: 'Could not connect to Freighter wallet. Is it installed?',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="sticky top-0 z-50 flex flex-col">
      <div className="flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-md border-border">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 mr-6">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full bg-cream-lavender-gradient animate-pulse-slow"></div>
              <Star className="relative w-6 h-6 text-primary drop-shadow-lg" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-lg">Stellar DAO Hub</span>
          </Link>
          
          {/* Navigation menu for desktop */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link
                    to={item.href}
                    className={`${navigationMenuTriggerStyle()} flex items-center gap-2 ${
                      location.pathname === item.href ? 'bg-accent/50' : ''
                    }`}
                    style={{ 
                      backgroundColor: location.pathname === item.href ? '#723480' : 'transparent',
                      color: location.pathname === item.href ? 'white' : 'inherit'
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-4">
          {isWalletConnected && publicKey ? (
            <Button 
              variant="outline" 
              className="border-primary/30 hover:border-primary/60"
              onClick={disconnectWallet}
              style={{ backgroundColor: 'transparent', color: '#723480', borderColor: '#723480' }}
            >
              {formatPublicKey(publicKey)}
            </Button>
          ) : (
            <Button 
              onClick={handleConnectWallet}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
              style={{ backgroundColor: '#723480' }}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      
      {/* Contract Address Display */}
      <div className="w-full px-4 py-2 text-center bg-background/60 backdrop-blur-sm border-b border-border">
        <p className="text-xs font-mono">
          <span className="mr-2 text-muted-foreground">Contract Address:</span>
          <span className="font-medium" style={{ color: '#723480' }}>CBWMMKKCMBG6NNWHUQWTNQQBEQVLNH7FA5TBZOLREH7GQ26XUTDVS3CJ</span>
        </p>
      </div>
    </div>
  );
};

export default Navbar;

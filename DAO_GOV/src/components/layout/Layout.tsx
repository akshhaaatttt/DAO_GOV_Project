
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => !prevState);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  React.useEffect(() => {
    // Set loaded state for animations
    setIsLoaded(true);
  }, []);
  
  return (
    <div className="min-h-screen bg-cream-lavender-gradient text-foreground flex flex-col">
      <div className={`fixed inset-0 bg-secondary/20 opacity-0 ${isLoaded ? 'opacity-100' : ''} transition-opacity duration-1000`}></div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        <div className="flex flex-1 relative">
          <Sidebar 
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            closeSidebar={closeSidebar}
          />
          
          <main className={`w-full transition-all duration-500 flex-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="container pb-12 pt-6 animated-gradient">
              {children}
            </div>
          </main>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default Layout;


import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 backdrop-blur-sm border-t border-border relative z-20" style={{ backgroundColor: '#723480' }}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full bg-cream-lavender-gradient animate-pulse-slow"></div>
                <Star className="relative w-6 h-6 text-white drop-shadow-lg animate-float" strokeWidth={1.5} />
              </div>
              <span className="font-bold text-lg text-white">
                Stellar DAO Hub
              </span>
            </div>
            <p className="text-sm text-white/80 pr-4">
              A decentralized governance platform for Stellar-based DAOs, enabling transparent and efficient community decision-making.
            </p>
          </div>
          
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <h3 className="font-medium text-white">Navigation</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/" className="text-white/80 hover:text-white transition-colors">Dashboard</Link></li>
                  <li><Link to="/proposals" className="text-white/80 hover:text-white transition-colors">Proposals</Link></li>
                  <li><Link to="/members" className="text-white/80 hover:text-white transition-colors">Members</Link></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-white">Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">Stellar.org</a></li>
                  <li><a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">Soroban</a></li>
                  <li><a href="https://docs.stellar.org" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-white">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-white/80 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-white/80 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-white/80 hover:text-white transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-white">Connect</h3>
                <div className="flex space-x-3">
                  <a href="https://github.com/akshhaaatttt" className="text-white/80 hover:text-white transition-colors">
                    <Github size={20} />
                  </a>
                  <a href="https://x.com/Akshat151105/status/1876298066514640955?t=P3vSOMmDsqghYjNTxWXvfQ&s=19" className="text-white/80 hover:text-white transition-colors">
                    <Twitter size={20} />
                  </a>
                  <a href="https://www.linkedin.com/in/akshat-jain-516404303" className="text-white/80 hover:text-white transition-colors">
                    <Linkedin size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-8 mt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/80">
              &copy; {new Date().getFullYear()} @akshhaaatttt. All rights reserved.
            </p>
            <p className="text-sm text-white/80 mt-2 md:mt-0">
              Powered by <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Stellar Network</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

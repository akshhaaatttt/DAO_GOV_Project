
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Proposals from "./pages/Proposals";
import CreateProposal from "./pages/CreateProposal";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Vote from "./pages/Vote";
import { WalletProvider } from "@/lib/context/WalletContext";

// Add global type for Freighter
declare global {
  interface Window {
    freighter?: any;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WalletProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/proposals" element={<Proposals />} />
              <Route path="/create-proposal" element={<CreateProposal />} />
              <Route path="/vote/:proposalId" element={<Vote />} />
              <Route path="/members" element={<Members />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Layout from "./components/layout/Layout";
// import Dashboard from "./pages/Dashboard";
// import Proposals from "./pages/Proposals";
// import CreateProposal from "./pages/CreateProposal";
// import Members from "./pages/Members";
// import Settings from "./pages/Settings";
// import NotFound from "./pages/NotFound";
// import Vote from "./pages/Vote";
// import Tutorial from "./pages/Tutorial";
// import { WalletProvider } from "@/lib/context/WalletContext";

// // Add global type for Freighter
// declare global {
//   interface Window {
//     freighter?: any;
//   }
// }

// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <WalletProvider>
//         <BrowserRouter>
//           <Layout>
//             <Routes>
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/proposals" element={<Proposals />} />
//               <Route path="/create-proposal" element={<CreateProposal />} />
//               <Route path="/vote/:proposalId" element={<Vote />} />
//               <Route path="/members" element={<Members />} />
//               <Route path="/settings" element={<Settings />} />
//               <Route path="/tutorial" element={<Tutorial />} />
//               {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </Layout>
//         </BrowserRouter>
//       </WalletProvider>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;


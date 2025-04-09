
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ArrowRight, Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getProposals, checkFreighterConnection, subscribeToProposals, ProposalUI } from '@/lib/stellar/soroban';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/lib/context/WalletContext';

const Proposals = () => {
  const [proposals, setProposals] = useState<ProposalUI[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { proposalId } = useParams<{ proposalId: string }>();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { connected } = await checkFreighterConnection();
        setIsConnected(connected);

        const proposalsData = await getProposals();
        console.log('Proposals data:', proposalsData);
        setProposals(proposalsData);
        
        // If we have a proposalId parameter, navigate to the Vote page
        if (proposalId) {
          navigate(`/vote/${proposalId}`);
        }
        
        // Subscribe to real-time updates
        const subscription = subscribeToProposals((updatedProposals) => {
          setProposals(updatedProposals);
        });
        
        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching proposals:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch proposals data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast, proposalId, navigate]);

  const processProposals = (allProposals: ProposalUI[]) => {
    if (!allProposals) return { activeProposals: [], pendingProposals: [], closedProposals: [] };
    
    const now = new Date();
    return allProposals.reduce(
      (acc, proposal) => {
        // Override the status based on the current time and proposal dates
        let status = proposal.status;
        
        if (status === 'Pending' && proposal.startTime <= now) {
          status = 'Active';
        } else if (status === 'Active' && proposal.endTime <= now) {
          status = 'Failed'; // Using 'Failed' instead of 'Closed' to match allowed types
        }
        
        if (status === 'Active') {
          acc.activeProposals.push({...proposal, status});
        } else if (status === 'Pending') {
          acc.pendingProposals.push({...proposal, status});
        } else {
          // This includes Failed, Passed, and Executed statuses
          acc.closedProposals.push({...proposal, status});
        }
        
        return acc;
      },
      { 
        activeProposals: [] as ProposalUI[], 
        pendingProposals: [] as ProposalUI[],  
        closedProposals: [] as ProposalUI[] 
      }
    );
  };
  
  const { activeProposals, pendingProposals, closedProposals } = processProposals(proposals);
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  };
  
  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const getTimeRemaining = (endTime: Date) => {
    if (!endTime || !(endTime instanceof Date) || isNaN(endTime.getTime())) {
      return 'Unknown';
    }
    
    const diff = endTime.getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      return `${hours}h remaining`;
    }
  };
  
  const filterProposals = (proposalsList: any[]) => {
    if (!searchTerm) return proposalsList;
    
    return proposalsList.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            Browse and vote on governance proposals
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/create-proposal')}
          disabled={!isConnected}
          style={{ backgroundColor: '#723480', color: 'white' }}
        >
          Create Proposal
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search proposals..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="stellar-card">
        <CardHeader>
          <CardTitle>All Proposals</CardTitle>
          <CardDescription>
            Governance proposals for the DAO to vote on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active <span className="ml-1 text-xs">{activeProposals.length}</span>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending <span className="ml-1 text-xs">{pendingProposals.length}</span>
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed <span className="ml-1 text-xs">{closedProposals.length}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {filterProposals(activeProposals).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {activeProposals.length === 0 ? 
                    'No active proposals at this time' : 
                    'No proposals matching your search'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filterProposals(activeProposals).map((proposal) => (
                    <div 
                      key={proposal.id} 
                      className="p-4 border rounded-lg bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vote/${proposal.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {proposal.id} • {formatAddress(proposal.creator)}
                          </p>
                        </div>
                        <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Active
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {proposal.description.length > 120
                          ? `${proposal.description.substring(0, 120)}...`
                          : proposal.description
                        }
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>Ends {formatDate(proposal.endTime)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{getTimeRemaining(proposal.endTime)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>For: {proposal.forVotes.toLocaleString()}</span>
                          <span>Against: {proposal.againstVotes.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100 || 0}
                          className="h-2 bg-muted"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vote/${proposal.id}`);
                          }}
                        >
                          Vote Now <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending">
              {filterProposals(pendingProposals).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {pendingProposals.length === 0 ? 
                    'No pending proposals at this time' : 
                    'No proposals matching your search'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filterProposals(pendingProposals).map((proposal) => (
                    <div 
                      key={proposal.id} 
                      className="p-4 border rounded-lg bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vote/${proposal.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {proposal.id} • {formatAddress(proposal.creator)}
                          </p>
                        </div>
                        <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                          Pending
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {proposal.description.length > 120
                          ? `${proposal.description.substring(0, 120)}...`
                          : proposal.description
                        }
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>Starts {formatDate(proposal.startTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="closed">
              {filterProposals(closedProposals).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {closedProposals.length === 0 ? 
                    'No closed proposals at this time' : 
                    'No proposals matching your search'
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filterProposals(closedProposals).map((proposal) => (
                    <div 
                      key={proposal.id} 
                      className="p-4 border rounded-lg bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vote/${proposal.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {proposal.id} • {formatAddress(proposal.creator)}
                          </p>
                        </div>
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          proposal.status === 'Passed' || proposal.status === 'Executed'
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {proposal.status}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {proposal.description.length > 120
                          ? `${proposal.description.substring(0, 120)}...`
                          : proposal.description
                        }
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>Ended {formatDate(proposal.endTime)}</span>
                        </div>
                        <div className="flex items-center">
                          {proposal.status === 'Passed' || proposal.status === 'Executed' ? (
                            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3 text-red-500" />
                          )}
                          <span>{proposal.status}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>For: {proposal.forVotes.toLocaleString()}</span>
                          <span>Against: {proposal.againstVotes.toLocaleString()}</span>
                        </div>
                        <Progress 
                          value={(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100 || 0}
                          className="h-2 bg-muted"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Proposals;

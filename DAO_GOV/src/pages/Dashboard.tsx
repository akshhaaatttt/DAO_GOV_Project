import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  Check, 
  Clock, 
  X,
  Users,
  Vote,
  FileText,
  Calendar,
  PlayCircle
} from 'lucide-react';
import { getProposals, getGovernanceSettings, getMembers } from '@/lib/stellar/soroban';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/lib/context/WalletContext';

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
};

const safeNumberFormat = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '0';
  return value.toLocaleString();
};

const Dashboard = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const { isWalletConnected, connectWallet, isLoading } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const proposalsData = await getProposals();
        const settingsData = await getGovernanceSettings();
        const membersData = await getMembers();
        
        setProposals(proposalsData || []);
        setSettings(settingsData || {});
        setMembers(membersData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch governance data',
          variant: 'destructive',
        });
      }
    };
    
    fetchData();
  }, [toast]);

  const activeProposals = Array.isArray(proposals) ? proposals.filter(p => p?.status === 'Active') : [];
  const pendingProposals = Array.isArray(proposals) ? proposals.filter(p => p?.status === 'Pending') : [];
  const closedProposals = Array.isArray(proposals) ? proposals.filter(p => ['Passed', 'Failed', 'Executed'].includes(p?.status)) : [];
  
  const totalVotingPower = Array.isArray(members) ? members.reduce((acc, member) => acc + (member?.votingPower || 0), 0) : 0;
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
  };

  const calculateVotePercentage = (forVotes: number, againstVotes: number) => {
    const total = (forVotes || 0) + (againstVotes || 0);
    if (total === 0) return 0;
    return ((forVotes || 0) / total) * 100;
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of the DAO governance system
          </p>
        </div>
        
        <Button 
          className="bg-stellar-gradient"
          onClick={() => navigate('/create-proposal')}
          disabled={!isWalletConnected}
        >
          Create Proposal
        </Button>
      </div>
      
      {!isWalletConnected && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-medium">Connect Your Wallet</h4>
                <p className="text-sm text-muted-foreground">
                  Connect your Freighter wallet to participate in governance and view your voting power.
                </p>
              </div>
              <div className="sm:ml-auto">
                <Button 
                  onClick={handleConnectWallet}
                  className="bg-stellar-gradient hover:bg-stellar-gradient/90"
                  disabled={isLoading}
                >
                  Connect Wallet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stellar-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active DAO participants
            </p>
          </CardContent>
        </Card>
        
        <Card className="stellar-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Voting Power
            </CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeNumberFormat(totalVotingPower)}</div>
            <p className="text-xs text-muted-foreground">
              Total governance power
            </p>
          </CardContent>
        </Card>
        
        <Card className="stellar-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Proposals
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProposals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Open for voting
            </p>
          </CardContent>
        </Card>
        
        <Card className="stellar-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Governance Settings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.quorum || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Quorum threshold
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="stellar-card cosmic-glow">
        <CardHeader>
          <CardTitle>Governance Parameters</CardTitle>
          <CardDescription>
            Current DAO governance configuration parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Quorum</p>
              <p className="text-xl font-bold">{settings?.quorum || 0}%</p>
              <p className="text-xs text-muted-foreground">
                Minimum participation required
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Voting Period</p>
              <p className="text-xl font-bold">{settings?.votingPeriod || 0} hours</p>
              <p className="text-xs text-muted-foreground">
                Duration for voting on proposals
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Voting Delay</p>
              <p className="text-xl font-bold">{settings?.votingDelay || 0} hours</p>
              <p className="text-xs text-muted-foreground">
                Delay before voting starts
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Execution Delay</p>
              <p className="text-xl font-bold">{settings?.executionDelay || 0} hours</p>
              <p className="text-xs text-muted-foreground">
                Timelock before execution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Video Section */}
      <Card className="stellar-card cosmic-glow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-purple-500" />
            <CardTitle>Getting Started Tutorial</CardTitle>
          </div>
          <CardDescription>
            Learn how to participate in DAO governance effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/aOKOfWkZPrc"
                  title="DAO_GOVERNANCE_PROJECT_USING_STELLAR"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">How to Participate:</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="mt-1">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="font-medium">Connect Freighter Wallet</span>
                      <p className="text-muted-foreground">Connect your Stellar Testnet wallet to get started</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="font-medium">Register as Member</span>
                      <p className="text-muted-foreground">One-time fee of 10 XLM to join the DAO</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="font-medium">Create Proposals</span>
                      <p className="text-muted-foreground">Members can create proposals for 5 XLM each</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="font-medium">View Active Proposals</span>
                      <p className="text-muted-foreground">Browse and review current proposals</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="font-medium">Vote on Proposals</span>
                      <p className="text-muted-foreground">Cast YES/NO votes for 0.5 XLM per vote</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="font-medium">Track Results</span>
                      <p className="text-muted-foreground">See live voting results and proposal status</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="stellar-card">
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
          <CardDescription>
            Overview of governance proposals and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {!activeProposals.length ? (
                <div className="text-center py-6 text-muted-foreground">
                  No active proposals at this time
                </div>
              ) : (
                <div className="space-y-4">
                  {activeProposals.map((proposal) => (
                    <div key={proposal?.id} className="p-4 border rounded-lg bg-card/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{proposal?.title || 'Unnamed Proposal'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatAddress(proposal?.creator || '')} • Ends {formatDate(proposal?.endTime)}
                          </p>
                        </div>
                        <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          Active
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>For: {safeNumberFormat(proposal?.forVotes)}</span>
                          <span>Against: {safeNumberFormat(proposal?.againstVotes)}</span>
                        </div>
                        <Progress 
                          value={calculateVotePercentage(proposal?.forVotes, proposal?.againstVotes)}
                          className="h-2 bg-muted"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => navigate(`/proposals?id=${proposal?.id}`)}
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
              {!pendingProposals.length ? (
                <div className="text-center py-6 text-muted-foreground">
                  No pending proposals at this time
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProposals.map((proposal) => (
                    <div key={proposal?.id} className="p-4 border rounded-lg bg-card/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{proposal?.title || 'Unnamed Proposal'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatAddress(proposal?.creator || '')} • Starts {formatDate(proposal?.startTime)}
                          </p>
                        </div>
                        <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                          Pending
                        </div>
                      </div>
                      <div className="mt-4 text-sm">
                        <p className="text-muted-foreground">{proposal?.description || 'No description provided'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="closed">
              {!closedProposals.length ? (
                <div className="text-center py-6 text-muted-foreground">
                  No closed proposals at this time
                </div>
              ) : (
                <div className="space-y-4">
                  {closedProposals.map((proposal) => (
                    <div key={proposal?.id} className="p-4 border rounded-lg bg-card/30">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{proposal?.title || 'Unnamed Proposal'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatAddress(proposal?.creator || '')} • Ended {formatDate(proposal?.endTime)}
                          </p>
                        </div>
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          proposal?.status === 'Passed' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {proposal?.status || 'Unknown'}
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>For: {safeNumberFormat(proposal?.forVotes)}</span>
                          <span>Against: {safeNumberFormat(proposal?.againstVotes)}</span>
                        </div>
                        <Progress 
                          value={calculateVotePercentage(proposal?.forVotes, proposal?.againstVotes)}
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
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => navigate('/proposals')}>
            View All Proposals
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Dashboard;


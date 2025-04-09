
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { getProposalById, castVote, getVotes, VoteUI, ProposalUI, getMemberByAddress } from '@/lib/stellar/soroban';
import { useWallet } from '@/lib/context/WalletContext';

const Vote = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isWalletConnected, publicKey, connectWallet, isMember, voteOnProposal, isLoading } = useWallet();
  
  const [proposal, setProposal] = useState<ProposalUI | null>(null);
  const [votes, setVotes] = useState<VoteUI[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'For' | 'Against' | 'Abstain' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState<'For' | 'Against' | 'Abstain' | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!proposalId) return;
      
      try {
        setLoading(true);
        const proposalData = await getProposalById(proposalId);
        
        if (!proposalData) {
          toast({
            title: 'Error',
            description: 'Proposal not found',
            variant: 'destructive',
          });
          navigate('/proposals');
          return;
        }
        
        setProposal(proposalData);
        
        const votesData = await getVotes(proposalId);
        setVotes(votesData);
        
        if (isWalletConnected && publicKey) {
          const userVoteRecord = votesData.find((vote) => vote.voter === publicKey);
          if (userVoteRecord) {
            setHasVoted(true);
            setUserVote(userVoteRecord.voteType);
          }
        }
      } catch (error) {
        console.error('Error fetching proposal data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch proposal data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [proposalId, navigate, toast, isWalletConnected, publicKey]);
  
  const handleVote = async (voteType: 'For' | 'Against' | 'Abstain') => {
    if (!isWalletConnected || !publicKey) {
      try {
        await connectWallet();
        return; // Return after connecting, we'll need to check membership status
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Please connect your wallet to vote',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (!isMember) {
      toast({
        title: 'Membership Required',
        description: 'You need to be a registered member to vote. Please register on the Members page.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!proposal || hasVoted || !proposalId) return;
    
    try {
      setIsVoting(true);
      
      const member = await getMemberByAddress(publicKey);
      const votingPower = member?.votingPower || 0;
      
      if (!votingPower) {
        toast({
          title: 'Error',
          description: 'You do not have any voting power',
          variant: 'destructive',
        });
        return;
      }
      
      // Use the new voteOnProposal function that handles payment transaction
      const success = await voteOnProposal(proposalId, voteType, votingPower);
      
      if (success) {
        // Record the vote in the database
        await castVote({
          proposalId: proposal.id,
          voter: publicKey,
          voteType,
          votingPower,
        });
        
        // Update local state
        const updatedProposal = { ...proposal };
        if (voteType === 'For') {
          updatedProposal.forVotes += votingPower;
        } else if (voteType === 'Against') {
          updatedProposal.againstVotes += votingPower;
        } else {
          updatedProposal.abstainVotes += votingPower;
        }
        
        setProposal(updatedProposal);
        setHasVoted(true);
        setUserVote(voteType);
        
        toast({
          title: 'Success',
          description: 'Your vote has been cast',
        });
        
        const updatedVotes = await getVotes(proposal.id);
        setVotes(updatedVotes);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to cast your vote',
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
    }
  };
  
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };
  
  const isProposalActive = (proposal: ProposalUI) => {
    if (proposal.status !== 'Active') return false;
    
    const now = new Date();
    return proposal.startTime <= now && proposal.endTime > now;
  };
  
  const getTotalVotes = (proposal: ProposalUI) => {
    return proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  };
  
  const getVotePercentage = (count: number, total: number) => {
    if (!total) return 0;
    return (count / total) * 100;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-medium mb-2">Proposal Not Found</h2>
        <p className="text-muted-foreground mb-4">The proposal you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => navigate('/proposals')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Proposals
        </Button>
      </div>
    );
  }
  
  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPercentage = totalVotes ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes ? (proposal.abstainVotes / totalVotes) * 100 : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="outline" onClick={() => navigate('/proposals')} className="mr-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Proposal Details</h1>
      </div>
      
      <Card className="stellar-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{proposal.title}</CardTitle>
              <CardDescription className="mt-1">
                {proposal.id} • Created by {formatAddress(proposal.creatorAddress)}
              </CardDescription>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              proposal.status === 'Active' ? 'bg-green-500/10 text-green-500' :
              proposal.status === 'Pending' ? 'bg-blue-500/10 text-blue-500' :
              proposal.status === 'Passed' || proposal.status === 'Executed' ? 'bg-green-500/10 text-green-500' :
              'bg-red-500/10 text-red-500'
            }`}>
              {proposal.status}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <span className="inline-block mr-6">Start: {formatDate(proposal.startTime)}</span>
              <span className="inline-block">End: {formatDate(proposal.endTime)}</span>
            </div>
            {proposal.status === 'Active' && (
              <div className="text-sm font-medium">
                {getTimeRemaining(proposal.endTime)}
              </div>
            )}
          </div>
          
          <Separator />
          
          <div className="prose max-w-none dark:prose-invert">
            <p>{proposal.description}</p>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Votes</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>For</span>
                  <span>{proposal.forVotes.toLocaleString()} ({forPercentage.toFixed(2)}%)</span>
                </div>
                <Progress value={forPercentage} className="h-2 bg-muted" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Against</span>
                  <span>{proposal.againstVotes.toLocaleString()} ({againstPercentage.toFixed(2)}%)</span>
                </div>
                <Progress value={againstPercentage} className="h-2 bg-muted" />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Abstain</span>
                  <span>{proposal.abstainVotes.toLocaleString()} ({abstainPercentage.toFixed(2)}%)</span>
                </div>
                <Progress value={abstainPercentage} className="h-2 bg-muted" />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Total votes: {totalVotes.toLocaleString()}
            </div>
          </div>
        </CardContent>
        
        {proposal.status === 'Active' && (
          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            
            {hasVoted ? (
              <div className="w-full p-4 bg-muted rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="font-medium">You have voted: {userVote}</p>
                    <p className="text-sm text-muted-foreground">Your vote has been recorded</p>
                  </div>
                </div>
              </div>
            ) : !isWalletConnected ? (
              <div className="w-full">
                <Button 
                  className="w-full bg-stellar-gradient"
                  onClick={connectWallet}
                >
                  Connect Wallet to Vote
                </Button>
              </div>
            ) : !isMember ? (
              <div className="w-full">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-md mb-4">
                  <p className="font-medium">Membership Required</p>
                  <p className="text-sm">You need to be a registered member to vote on proposals.</p>
                </div>
                <Button 
                  className="w-full bg-stellar-gradient"
                  onClick={() => navigate('/members')}
                >
                  Register as Member
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <h3 className="text-lg font-medium mb-3">Cast Your Vote</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={selectedVote === 'For' ? 'default' : 'outline'}
                    className={selectedVote === 'For' ? 'bg-[#723480] hover:bg-[#723480]/90 text-white' : ''}
                    onClick={() => setSelectedVote('For')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> For
                  </Button>
                  <Button
                    variant={selectedVote === 'Against' ? 'default' : 'outline'}
                    className={selectedVote === 'Against' ? 'bg-[#723480] hover:bg-[#723480]/90 text-white' : ''}
                    onClick={() => setSelectedVote('Against')}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Against
                  </Button>
                  <Button
                    variant={selectedVote === 'Abstain' ? 'default' : 'outline'}
                    className={selectedVote === 'Abstain' ? 'bg-[#723480] hover:bg-[#723480]/90 text-white' : ''}
                    onClick={() => setSelectedVote('Abstain')}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" /> Abstain
                  </Button>
                </div>
                
                <Button 
                  className="w-full mt-4 bg-stellar-gradient"
                  disabled={!selectedVote || isVoting || isLoading}
                  onClick={() => selectedVote && handleVote(selectedVote)}
                >
                  {(isVoting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isVoting ? 'Processing Payment...' : 'Submit Vote (0.5 XLM)'}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Voting requires a small fee of 0.5 XLM
                </p>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};

export default Vote;

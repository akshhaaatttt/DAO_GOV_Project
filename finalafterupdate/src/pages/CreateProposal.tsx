import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { createProposal } from '@/lib/stellar/soroban';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/lib/context/WalletContext';

const CreateProposal = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPaidFee, setHasPaidFee] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isWalletConnected, publicKey, isMember, payProposalFee, isLoading } = useWallet();

  const handlePayFee = async () => {
    const success = await payProposalFee();
    if (success) {
      setHasPaidFee(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !startDate || !endDate) {
      toast({
        title: 'Incomplete form',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (endDate <= startDate) {
      toast({
        title: 'Invalid date range',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const now = new Date();
      const status = startDate <= now ? 'Active' : 'Pending';
      
      const proposal = {
        title,
        description,
        creator: 'Current User',
        creatorAddress: publicKey || 'GDUMMYADDRESS123456789',
        status: status as 'Pending' | 'Active',
        forVotes: 0,
        againstVotes: 0,
        abstainVotes: 0,
        startTime: startDate,
        endTime: endDate
      };
      
      const createdProposal = await createProposal(proposal);
      
      toast({
        title: 'Proposal created',
        description: `Your proposal has been created successfully and is now ${status.toLowerCase()}`,
      });
      
      navigate('/proposals');
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create proposal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWalletConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Proposal</h1>
          <p className="text-muted-foreground">
            Submit a new governance proposal for the DAO
          </p>
        </div>
        
        <Card className="stellar-card p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Wallet Not Connected</h2>
            <p className="text-muted-foreground">
              Please connect your Freighter wallet to create a proposal.
            </p>
            <div className="flex justify-center mt-4">
              <button 
                className="freighter-connect-button"
                onClick={() => navigate('/')}
                style={{ backgroundColor: '#723480', color: 'white' }}
              >
                <span>Go to Home</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Proposal</h1>
          <p className="text-muted-foreground">
            Submit a new governance proposal for the DAO
          </p>
        </div>
        
        <Card className="stellar-card p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Not a Member</h2>
            <p className="text-muted-foreground">
              You need to register as a member before creating proposals. 
              This requires a payment of 10 XLM.
            </p>
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => navigate('/members')}
                className="bg-stellar-gradient"
              >
                Register as Member
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!hasPaidFee) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Proposal</h1>
          <p className="text-muted-foreground">
            Submit a new governance proposal for the DAO
          </p>
        </div>
        
        <Card className="stellar-card p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Pay Proposal Fee</h2>
            <p className="text-muted-foreground">
              Creating a proposal requires a fee of 5 XLM that will be sent to the DAO treasury.
            </p>
            <div className="flex justify-center mt-4">
              <Button
                onClick={handlePayFee}
                className="bg-stellar-gradient"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay 5 XLM Fee"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Proposal</h1>
        <p className="text-muted-foreground">
          Submit a new governance proposal for the DAO
        </p>
      </div>
      
      <Card className="stellar-card">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>New Proposal</CardTitle>
            <CardDescription>
              Fill out the form below to create a new governance proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a clear, concise title"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of your proposal"
                rows={6}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={isSubmitting}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={isSubmitting}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/proposals')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-stellar-gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateProposal;

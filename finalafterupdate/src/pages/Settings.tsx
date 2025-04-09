import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getGovernanceSettings, updateGovernanceSettings } from '@/lib/stellar/soroban';
import { useToast } from '@/hooks/use-toast';
import { Info, Loader2, Save } from 'lucide-react';
import { useWallet } from '@/lib/context/WalletContext';

const Settings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { isWalletConnected, publicKey, connectWallet } = useWallet();
  
  const [quorum, setQuorum] = useState('');
  const [votingPeriod, setVotingPeriod] = useState('');
  const [votingDelay, setVotingDelay] = useState('');
  const [executionDelay, setExecutionDelay] = useState('');
  const [proposalThreshold, setProposalThreshold] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        setIsAdmin(isWalletConnected);
        
        const settingsData = await getGovernanceSettings();
        setSettings(settingsData);
        
        setQuorum(settingsData.quorum.toString());
        setVotingPeriod(settingsData.votingPeriod.toString());
        setVotingDelay(settingsData.votingDelay.toString());
        setExecutionDelay(settingsData.executionDelay.toString());
        setProposalThreshold(settingsData.proposalThreshold.toString());
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch governance settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast, isWalletConnected]);
  
  const handleSaveSettings = async () => {
    try {
      setUpdating(true);
      
      await updateGovernanceSettings({
        quorum: parseInt(quorum),
        votingPeriod: parseInt(votingPeriod),
        votingDelay: parseInt(votingDelay),
        executionDelay: parseInt(executionDelay),
        proposalThreshold: parseInt(proposalThreshold),
      });
      
      toast({
        title: 'Settings Updated',
        description: 'Governance settings have been successfully updated',
      });
      
      setSettings({
        id: settings.id,
        quorum: parseInt(quorum),
        votingPeriod: parseInt(votingPeriod),
        votingDelay: parseInt(votingDelay),
        executionDelay: parseInt(executionDelay),
        proposalThreshold: parseInt(proposalThreshold),
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update governance settings',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure DAO governance parameters
        </p>
      </div>
      
      {!isWalletConnected || !isAdmin ? (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="p-3 rounded-full bg-orange-500/10 text-orange-500">
                <Info className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-medium">Admin Access Required</h4>
                <p className="text-sm text-muted-foreground">
                  You need to connect with an admin wallet to modify governance settings.
                </p>
              </div>
              <div className="sm:ml-auto">
                <button 
                  className="freighter-connect-button"
                  onClick={() => connectWallet()}
                  style={{ backgroundColor: '#723480', color: 'white' }}
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="stellar-card cosmic-glow">
          <CardHeader>
            <CardTitle>Governance Parameters</CardTitle>
            <CardDescription>
              Configure the core parameters that govern the DAO's decision-making process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quorum">Quorum (%)</Label>
                <Input
                  id="quorum"
                  type="number"
                  min="1"
                  max="100"
                  value={quorum}
                  onChange={(e) => setQuorum(e.target.value)}
                  placeholder="Minimum participation percentage"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum percentage of total voting power that must participate for a vote to be valid
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proposalThreshold">Proposal Threshold</Label>
                <Input
                  id="proposalThreshold"
                  type="number"
                  min="0"
                  value={proposalThreshold}
                  onChange={(e) => setProposalThreshold(e.target.value)}
                  placeholder="Minimum tokens to propose"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum voting power required to create a proposal
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="votingPeriod">Voting Period (hours)</Label>
                <Input
                  id="votingPeriod"
                  type="number"
                  min="1"
                  value={votingPeriod}
                  onChange={(e) => setVotingPeriod(e.target.value)}
                  placeholder="Duration of voting"
                />
                <p className="text-xs text-muted-foreground">
                  Duration in hours that voting remains open for each proposal
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="votingDelay">Voting Delay (hours)</Label>
                <Input
                  id="votingDelay"
                  type="number"
                  min="0"
                  value={votingDelay}
                  onChange={(e) => setVotingDelay(e.target.value)}
                  placeholder="Delay before voting starts"
                />
                <p className="text-xs text-muted-foreground">
                  Delay in hours between proposal creation and voting start
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="executionDelay">Execution Delay (hours)</Label>
                <Input
                  id="executionDelay"
                  type="number"
                  min="0"
                  value={executionDelay}
                  onChange={(e) => setExecutionDelay(e.target.value)}
                  placeholder="Timelock period"
                />
                <p className="text-xs text-muted-foreground">
                  Delay in hours before an approved proposal can be executed (timelock)
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                disabled={updating}
                style={{ backgroundColor: '#723480', color: 'white' }}
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="stellar-card">
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
          <CardDescription>
            Details about the deployed governance contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Contract Address</Label>
            <div className="p-3 bg-muted/30 rounded-md font-mono text-sm break-all">
              CCSRPPOI5QKGKX4MIDJGUDGHEXY7VXWFSXDFC454QZCK7NQ4LGMXI4W5
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Network</Label>
            <div className="p-3 bg-muted/30 rounded-md text-sm">
              Stellar Testnet
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Soroban RPC URL</Label>
              <div className="p-3 bg-muted/30 rounded-md text-sm overflow-x-auto">
                https://soroban-testnet.stellar.org
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Horizon RPC URL</Label>
              <div className="p-3 bg-muted/30 rounded-md text-sm overflow-x-auto">
                https://horizon-testnet.stellar.org
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

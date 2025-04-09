
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, XCircle } from 'lucide-react';
import { useWallet } from '@/lib/context/WalletContext';
import { getMembers, MemberUI } from '@/lib/stellar/soroban';

const Members = () => {
  const [members, setMembers] = useState<MemberUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { toast } = useToast();
  const { 
    isWalletConnected, 
    publicKey, 
    connectWallet, 
    isAdmin, 
    isMember, 
    registerAsMember 
  } = useWallet();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const membersData = await getMembers();
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      
      if (!isWalletConnected) {
        await connectWallet();
        return;
      }
      
      const success = await registerAsMember();
      
      if (success) {
        await fetchMembers(); // Refresh the members list
      }
    } catch (error) {
      console.error('Error registering as member:', error);
      toast({
        title: 'Error',
        description: 'Failed to register as member',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  };

  // Helper function to format addresses
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to get avatar fallback from address
  const getAvatarFallback = (address: string) => {
    if (!address) return '';
    return address.substring(0, 2).toUpperCase();
  };

  const getRegistrationStatus = () => {
    if (!isWalletConnected) {
      return {
        message: 'Connect your wallet to register as a member',
        actionText: 'Connect Wallet',
        action: connectWallet,
        disabled: false
      };
    } else if (isMember) {
      return {
        message: 'You are registered as a member',
        actionText: 'Already Registered',
        action: () => {},
        disabled: true
      };
    } else {
      return {
        message: 'Register as a member to participate in governance (10 XLM fee)',
        actionText: registering ? 'Processing...' : 'Register',
        action: handleRegister,
        disabled: registering
      };
    }
  };

  const renderRegistrationCard = () => {
    const status = getRegistrationStatus();
    
    return (
      <Card className="mb-6 stellar-card">
        <CardContent className="p-6 flex flex-col items-center sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h3 className="text-lg font-medium">Membership Registration</h3>
            <p className="text-muted-foreground text-sm">{status.message}</p>
          </div>
          <Button 
            className="bg-stellar-gradient min-w-[150px]"
            onClick={status.action}
            disabled={status.disabled}
          >
            {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {status.actionText}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DAO Members</h1>
        <p className="text-muted-foreground">
          View registered members and their voting power
        </p>
      </div>

      {renderRegistrationCard()}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <Card className="stellar-card">
          <CardHeader>
            <CardTitle>Member List</CardTitle>
            <CardDescription>
              {members.length} registered members in the DAO
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No members found</p>
              </div>
            ) : (
              <TabsContent value="all" className="space-y-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 bg-muted/50 p-4 font-medium">
                    <div className="col-span-5">Member</div>
                    <div className="col-span-2 text-center">Voting Power</div>
                    <div className="col-span-2 text-center">Proposals</div>
                    <div className="col-span-2 text-center">Votes</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>

                  <div className="divide-y">
                    {members.map((member) => (
                      <div key={member.address} className="grid grid-cols-12 p-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getAvatarFallback(member.address)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{formatAddress(member.address)}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                          {member.address === 'GCO2T3PNZV6WGCH6EOZGL7WRRJ676N2AFP5ZOUFEX7KFXHRLAOEZHYMZ' && (
                            <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Admin</Badge>
                          )}
                        </div>
                        <div className="col-span-2 text-center">{member.votingPower.toLocaleString()}</div>
                        <div className="col-span-2 text-center">{member.proposalsCreated}</div>
                        <div className="col-span-2 text-center">{member.votesParticipated}</div>
                        <div className="col-span-1 flex justify-center">
                          {member.status === 'Active' ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="active" className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted/50 p-4 font-medium">
                  <div className="col-span-5">Member</div>
                  <div className="col-span-2 text-center">Voting Power</div>
                  <div className="col-span-2 text-center">Proposals</div>
                  <div className="col-span-2 text-center">Votes</div>
                  <div className="col-span-1 text-center">Status</div>
                </div>

                <div className="divide-y">
                  {members
                    .filter(member => member.status === 'Active')
                    .map((member) => (
                      <div key={member.address} className="grid grid-cols-12 p-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getAvatarFallback(member.address)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{formatAddress(member.address)}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                          {member.address === 'GCO2T3PNZV6WGCH6EOZGL7WRRJ676N2AFP5ZOUFEX7KFXHRLAOEZHYMZ' && (
                            <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Admin</Badge>
                          )}
                        </div>
                        <div className="col-span-2 text-center">{member.votingPower.toLocaleString()}</div>
                        <div className="col-span-2 text-center">{member.proposalsCreated}</div>
                        <div className="col-span-2 text-center">{member.votesParticipated}</div>
                        <div className="col-span-1 flex justify-center">
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted/50 p-4 font-medium">
                  <div className="col-span-5">Member</div>
                  <div className="col-span-2 text-center">Voting Power</div>
                  <div className="col-span-2 text-center">Proposals</div>
                  <div className="col-span-2 text-center">Votes</div>
                  <div className="col-span-1 text-center">Status</div>
                </div>

                <div className="divide-y">
                  {members
                    .filter(member => member.status === 'Inactive')
                    .map((member) => (
                      <div key={member.address} className="grid grid-cols-12 p-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getAvatarFallback(member.address)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{formatAddress(member.address)}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">{member.votingPower.toLocaleString()}</div>
                        <div className="col-span-2 text-center">{member.proposalsCreated}</div>
                        <div className="col-span-2 text-center">{member.votesParticipated}</div>
                        <div className="col-span-1 flex justify-center">
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Inactive</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Members;

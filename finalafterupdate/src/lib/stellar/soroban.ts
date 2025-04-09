import { supabase } from '@/integrations/supabase/client';
import { Database, ProposalUI, MemberUI, VoteUI, GovernanceSettingsUI } from '@/lib/types/supabase';

// Mock data interfaces - these will be used for the app UI components
// Update all database query methods to use the correct Database type
export const getProposals = async (): Promise<ProposalUI[]> => {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select('*');
    
    if (error) {
      console.error('Database error:', error);
      return [];
    }
    
    // Update active/pending status based on current date
    const now = new Date();
    const updatedData = data?.map(proposal => {
      if (proposal.status === 'Pending' && new Date(proposal.starttime) <= now) {
        // Update in database
        supabase
          .from('proposals')
          .update({ status: 'Active' })
          .eq('id', proposal.id)
          .then(({ error }) => {
            if (error) console.error('Error updating proposal status:', error);
          });
          
        // Update in local data
        return { ...proposal, status: 'Active' };
      }
      return proposal;
    }) || [];
    
    return updatedData.map(mapProposalFromDb);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
};

export const getProposalById = async (id: string): Promise<ProposalUI | null> => {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching proposal ${id}:`, error);
      return null;
    }
    
    return mapProposalFromDb(data);
  } catch (error) {
    console.error(`Error fetching proposal ${id}:`, error);
    return null;
  }
};

export const createProposal = async (proposal: Omit<ProposalUI, 'id' | 'created_at'>): Promise<ProposalUI> => {
  try {
    // Generate unique ID with timestamp
    const proposalId = `PROP-${Date.now()}`;
    
    // Convert Date objects to ISO strings for database
    const dbProposal = {
      id: proposalId,
      title: proposal.title,
      description: proposal.description,
      creator: proposal.creator,
      creatoraddress: proposal.creatorAddress,
      status: proposal.status,
      forvotes: proposal.forVotes,
      againstvotes: proposal.againstVotes,
      abstainvotes: proposal.abstainVotes,
      starttime: typeof proposal.startTime === 'string' ? proposal.startTime : proposal.startTime.toISOString(),
      endtime: typeof proposal.endTime === 'string' ? proposal.endTime : proposal.endTime.toISOString()
    };
    
    const { data, error } = await supabase
      .from('proposals')
      .insert(dbProposal)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating proposal:", error);
      throw error;
    }
    
    // If creator is a member, update their proposalsCreated count
    if (proposal.creatorAddress) {
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('address', proposal.creatorAddress)
        .single();
      
      if (memberData) {
        await supabase
          .from('members')
          .update({ 
            proposalscreated: (memberData.proposalscreated || 0) + 1 
          })
          .eq('address', proposal.creatorAddress);
      }
    }
    
    return mapProposalFromDb(data);
  } catch (error) {
    console.error('Error creating proposal:', error);
    throw error;
  }
};

export const updateProposal = async (id: string, updates: Partial<ProposalUI>): Promise<ProposalUI> => {
  try {
    // Convert properties to match database column names
    const dbUpdates: any = {};
    
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.forVotes !== undefined) dbUpdates.forvotes = updates.forVotes;
    if (updates.againstVotes !== undefined) dbUpdates.againstvotes = updates.againstVotes;
    if (updates.abstainVotes !== undefined) dbUpdates.abstainvotes = updates.abstainVotes;
    if (updates.startTime) {
      dbUpdates.starttime = typeof updates.startTime === 'string' 
        ? updates.startTime 
        : updates.startTime.toISOString();
    }
    if (updates.endTime) {
      dbUpdates.endtime = typeof updates.endTime === 'string' 
        ? updates.endTime 
        : updates.endTime.toISOString();
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      handleDbError(error);
    }
    
    return mapProposalFromDb(data);
  } catch (error) {
    console.error(`Error updating proposal ${id}:`, error);
    throw error;
  }
};

export const getMembers = async (): Promise<MemberUI[]> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*');
    
    if (error) {
      handleDbError(error);
    }
    
    return (data || []).map(mapMemberFromDb);
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
};

export const getMemberByAddress = async (address: string): Promise<MemberUI | null> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('address', address)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      handleDbError(error);
    }
    
    return data ? mapMemberFromDb(data) : null;
  } catch (error) {
    console.error(`Error fetching member ${address}:`, error);
    return null;
  }
};

export const createMember = async (member: Omit<MemberUI, 'joinDate'>): Promise<MemberUI> => {
  try {
    // Log the member we're about to create
    console.log("Creating member:", member);
    
    const dbMember = {
      address: member.address,
      votingpower: member.votingPower,
      proposalscreated: member.proposalsCreated,
      votesparticipated: member.votesParticipated,
      status: member.status
      // joindate will be automatically set by the database default value (now())
    };
    
    const { data, error } = await supabase
      .from('members')
      .insert(dbMember)
      .select()
      .single();
    
    if (error) {
      console.error("Error in supabase.from('members').insert:", error);
      handleDbError(error);
    }
    
    return mapMemberFromDb(data);
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

export const updateMember = async (address: string, updates: Partial<MemberUI>): Promise<MemberUI> => {
  try {
    // Convert properties to match database column names
    const dbUpdates: any = {};
    
    if (updates.votingPower !== undefined) dbUpdates.votingpower = updates.votingPower;
    if (updates.proposalsCreated !== undefined) dbUpdates.proposalscreated = updates.proposalsCreated;
    if (updates.votesParticipated !== undefined) dbUpdates.votesparticipated = updates.votesParticipated;
    if (updates.status) dbUpdates.status = updates.status;
    
    const { data, error } = await supabase
      .from('members')
      .update(dbUpdates)
      .eq('address', address)
      .select()
      .single();
    
    if (error) {
      handleDbError(error);
    }
    
    return mapMemberFromDb(data);
  } catch (error) {
    console.error(`Error updating member ${address}:`, error);
    throw error;
  }
};

export const getGovernanceSettings = async (): Promise<GovernanceSettingsUI> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      handleDbError(error);
    }
    
    return mapGovernanceSettingsFromDb(data);
  } catch (error) {
    console.error('Error fetching governance settings:', error);
    throw error;
  }
};

export const updateGovernanceSettings = async (updates: Partial<GovernanceSettingsUI>): Promise<GovernanceSettingsUI> => {
  try {
    // Convert properties to match database column names
    const dbUpdates: any = {};
    
    if (updates.quorum !== undefined) dbUpdates.quorum = updates.quorum;
    if (updates.votingPeriod !== undefined) dbUpdates.votingperiod = updates.votingPeriod;
    if (updates.votingDelay !== undefined) dbUpdates.votingdelay = updates.votingDelay;
    if (updates.executionDelay !== undefined) dbUpdates.executiondelay = updates.executionDelay;
    if (updates.proposalThreshold !== undefined) dbUpdates.proposalthreshold = updates.proposalThreshold;
    
    const { data, error } = await supabase
      .from('settings')
      .update(dbUpdates)
      .eq('id', 1)
      .select()
      .single();
    
    if (error) {
      handleDbError(error);
    }
    
    return mapGovernanceSettingsFromDb(data);
  } catch (error) {
    console.error('Error updating governance settings:', error);
    throw error;
  }
};

// Votes
export const getVotes = async (proposalId: string): Promise<VoteUI[]> => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('proposalid', proposalId);
    
    if (error) {
      handleDbError(error);
    }
    
    return (data || []).map(mapVoteFromDb);
  } catch (error) {
    console.error(`Error fetching votes for proposal ${proposalId}:`, error);
    return [];
  }
};

export const castVote = async (vote: Omit<VoteUI, 'id' | 'created_at'>): Promise<VoteUI> => {
  try {
    const dbVote = {
      proposalid: vote.proposalId,
      voter: vote.voter,
      votetype: vote.voteType,
      votingpower: vote.votingPower
    };
    
    const { data, error } = await supabase
      .from('votes')
      .insert(dbVote)
      .select()
      .single();
    
    if (error) {
      handleDbError(error);
    }
    
    return mapVoteFromDb(data);
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
};

// Connection to Stellar blockchain
export const connectWallet = async (): Promise<string | null> => {
  try {
    if (typeof window === 'undefined' || !window.freighter) {
      console.error('Freighter not installed');
      return null;
    }
    
    const publicKey = await window.freighter.getPublicKey();
    return publicKey;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
};

export const isConnected = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined' || !window.freighter) {
      return false;
    }
    
    return await window.freighter.isConnected();
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

// Add missing functions needed by Proposals.tsx and Members.tsx
export const checkFreighterConnection = async (): Promise<{connected: boolean, publicKey: string | null}> => {
  try {
    if (typeof window === 'undefined' || !window.freighter) {
      return { connected: false, publicKey: null };
    }
    
    const connected = await window.freighter.isConnected();
    const publicKey = connected ? await window.freighter.getPublicKey() : null;
    
    return { connected, publicKey };
  } catch (error) {
    console.error('Error checking Freighter connection:', error);
    return { connected: false, publicKey: null };
  }
};

// Implement the subscribeToProposals function with real-time updates
export const subscribeToProposals = (callback: (proposals: ProposalUI[]) => void) => {
  // Create a subscription to the proposals table
  const subscription = supabase
    .channel('proposals_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'proposals' },
      async () => {
        // When any change happens, fetch the latest proposals and update statuses
        const proposals = await getProposals();
        callback(proposals);
      }
    )
    .subscribe();

  // Return an object with an unsubscribe method
  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    }
  };
};

// Helper function to safely parse dates
const parseDate = (dateString: string | null): Date => {
  if (!dateString) return new Date();
  return new Date(dateString);
};

// Helper function to map database column names to interface properties
const mapProposalFromDb = (dbProposal: Database['public']['Tables']['proposals']['Row']): ProposalUI => {
  if (!dbProposal) return null as any;
  
  return {
    id: dbProposal.id,
    title: dbProposal.title,
    description: dbProposal.description,
    creator: dbProposal.creator,
    creatorAddress: dbProposal.creatoraddress,
    status: dbProposal.status as 'Pending' | 'Active' | 'Passed' | 'Failed' | 'Executed',
    forVotes: Number(dbProposal.forvotes) || 0,
    againstVotes: Number(dbProposal.againstvotes) || 0,
    abstainVotes: Number(dbProposal.abstainvotes) || 0,
    startTime: parseDate(dbProposal.starttime),
    endTime: parseDate(dbProposal.endtime),
    created_at: dbProposal.created_at ? parseDate(dbProposal.created_at) : undefined
  };
};

const mapMemberFromDb = (dbMember: Database['public']['Tables']['members']['Row']): MemberUI => {
  if (!dbMember) return null as any;
  
  return {
    address: dbMember.address,
    votingPower: Number(dbMember.votingpower) || 0,
    proposalsCreated: Number(dbMember.proposalscreated) || 0,
    votesParticipated: Number(dbMember.votesparticipated) || 0,
    status: dbMember.status as 'Active' | 'Inactive',
    joinDate: parseDate(dbMember.joindate)
  };
};

const mapVoteFromDb = (dbVote: Database['public']['Tables']['votes']['Row']): VoteUI => {
  if (!dbVote) return null as any;
  
  return {
    id: dbVote.id,
    proposalId: dbVote.proposalid,
    voter: dbVote.voter,
    voteType: dbVote.votetype as 'For' | 'Against' | 'Abstain',
    votingPower: Number(dbVote.votingpower) || 0,
    created_at: dbVote.created_at ? parseDate(dbVote.created_at) : undefined
  };
};

const mapGovernanceSettingsFromDb = (dbSettings: Database['public']['Tables']['settings']['Row']): GovernanceSettingsUI => {
  if (!dbSettings) return null as any;
  
  return {
    id: dbSettings.id,
    quorum: Number(dbSettings.quorum) || 0,
    votingPeriod: Number(dbSettings.votingperiod) || 0,
    votingDelay: Number(dbSettings.votingdelay) || 0,
    executionDelay: Number(dbSettings.executiondelay) || 0,
    proposalThreshold: Number(dbSettings.proposalthreshold) || 0
  };
};

// Handle database errors
const handleDbError = (error: any) => {
  console.error('Database error:', error);
  throw new Error(`Database operation failed: ${error.message || 'Unknown error'}`);
};

// Export the UI interface types as well to make them available to the pages
export type { ProposalUI, MemberUI, VoteUI, GovernanceSettingsUI };

export { // Re-export the database client and any other necessary exports
  supabase,
};

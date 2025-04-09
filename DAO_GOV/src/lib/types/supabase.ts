
// Define types for our Supabase tables
export interface Member {
  address: string;
  votingpower: number;
  proposalscreated: number;
  votesparticipated: number;
  status: string;
  joindate: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatoraddress: string;
  status: string;
  forvotes: number;
  againstvotes: number;
  abstainvotes: number;
  starttime: string;
  endtime: string;
  created_at?: string;
}

export interface Vote {
  id: string;
  proposalid: string;
  voter: string;
  votetype: string;
  votingpower: number;
  created_at?: string;
}

export interface GovernanceSettings {
  id: number;
  quorum: number;
  votingperiod: number;
  votingdelay: number;
  executiondelay: number;
  proposalthreshold: number;
}

// Define UI-specific interfaces with more friendly property names
export interface ProposalUI {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorAddress: string;
  status: 'Pending' | 'Active' | 'Passed' | 'Failed' | 'Executed';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startTime: Date;
  endTime: Date;
  created_at?: Date;
}

export interface MemberUI {
  address: string;
  votingPower: number;
  proposalsCreated: number;
  votesParticipated: number;
  status: 'Active' | 'Inactive';
  joinDate: Date;
}

export interface VoteUI {
  id: string;
  proposalId: string;
  voter: string;
  voteType: 'For' | 'Against' | 'Abstain';
  votingPower: number;
  created_at?: Date;
}

export interface GovernanceSettingsUI {
  id: number;
  quorum: number;
  votingPeriod: number;
  votingDelay: number;
  executionDelay: number;
  proposalThreshold: number;
}

// Define the database schema
export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'joindate'> & { joindate?: string };
        Update: Partial<Member>;
      };
      proposals: {
        Row: Proposal;
        Insert: Omit<Proposal, 'created_at'> & { created_at?: string };
        Update: Partial<Proposal>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Vote>;
      };
      settings: {
        Row: GovernanceSettings;
        Insert: Partial<GovernanceSettings> & { id: number };
        Update: Partial<GovernanceSettings>;
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}

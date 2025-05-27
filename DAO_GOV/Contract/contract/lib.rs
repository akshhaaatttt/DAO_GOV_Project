#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, Address, symbol_short};

// Define proposal status enum
#[contracttype]
#[derive(Clone)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Executed
}

// Define vote enum
#[contracttype]
#[derive(Clone)]
pub enum Vote {
    For,
    Against,
    Abstain
}

// Define proposal structure
#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub proposer: Address,
    pub creation_time: u64,
    pub voting_ends_at: u64,
    pub status: ProposalStatus,
    pub for_votes: u64,
    pub against_votes: u64,
    pub abstain_votes: u64,
    pub is_executed: bool,
    pub execution_time: u64,
}

// Define member structure
#[contracttype]
#[derive(Clone)]
pub struct Member {
    pub address: Address,
    pub joining_time: u64,
    pub voting_power: u64,
    pub is_active: bool,
}

// Define DAO settings structure
#[contracttype]
#[derive(Clone)]
pub struct DAOSettings {
    pub proposal_threshold: u64,       // Minimum voting power to create proposal
    pub quorum: u64,                   // Percentage of total voting power that must vote (basis points: 100 = 1%)
    pub voting_period: u64,            // Duration of voting in seconds
    pub execution_delay: u64,          // Time between passing and execution
    pub total_voting_power: u64,       // Sum of all voting power
    pub member_count: u64,             // Total number of members
    pub proposal_count: u64,           // Total number of proposals created
}

// Contract storage keys
const DAO_SETTINGS: Symbol = symbol_short!("SETTINGS");
const DAO_ADMIN: Symbol = symbol_short!("ADMIN");

// Contract enums for data mappings
#[contracttype]
pub enum ProposalDataKey {
    Proposal(u64),              // Maps proposal_id to Proposal
}

#[contracttype]
pub enum MemberDataKey {
    Member(Address),            // Maps address to Member
}

#[contracttype]
pub enum VoteDataKey {
    Vote(u64, Address),         // Maps (proposal_id, voter) to Vote
}

#[contract]
pub struct DAOGovernanceContract;

#[contractimpl]
impl DAOGovernanceContract {
    // Initialize the DAO with settings
    pub fn initialize(
        env: Env,
        admin: Address,
        proposal_threshold: u64,
        quorum: u64,
        voting_period: u64,
        execution_delay: u64
    ) {
        // Ensure contract is being initialized for the first time
        if env.storage().instance().has(&DAO_ADMIN) {
            panic!("Contract already initialized");
        }
        
        // Verify parameters
        if quorum > 10000 {  // quorum is in basis points (10000 = 100%)
            panic!("Quorum must be <= 10000");
        }

        // Store admin
        admin.require_auth();
        env.storage().instance().set(&DAO_ADMIN, &admin);
        
        // Set initial DAO settings
        let settings = DAOSettings {
            proposal_threshold,
            quorum,
            voting_period,
            execution_delay,
            total_voting_power: 0,
            member_count: 0,
            proposal_count: 0,
        };
        
        env.storage().instance().set(&DAO_SETTINGS, &settings);
        env.storage().instance().extend_ttl(10000, 10000);
        
        log!(&env, "DAO initialized with admin: {:?}", admin);
    }
    
    // Add a new member to the DAO
    pub fn add_member(env: Env, new_member: Address, voting_power: u64) {
        // Only admin can add members
        let admin: Address = env.storage().instance().get(&DAO_ADMIN).unwrap();
        admin.require_auth();
        
        // Create member instance
        let member = Member {
            address: new_member.clone(),
            joining_time: env.ledger().timestamp(),
            voting_power,
            is_active: true,
        };
        
        // Update DAO settings
        let mut settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        settings.total_voting_power += voting_power;
        settings.member_count += 1;
        
        // Store member and updated settings
        env.storage().instance().set(&MemberDataKey::Member(new_member.clone()), &member);
        env.storage().instance().set(&DAO_SETTINGS, &settings);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Member added: {:?} with voting power: {}", new_member, voting_power);
    }
    
    // Update member voting power
    pub fn update_voting_power(env: Env, member_addr: Address, new_voting_power: u64) {
        // Only admin can update voting power
        let admin: Address = env.storage().instance().get(&DAO_ADMIN).unwrap();
        admin.require_auth();
        
        // Get existing member
        let key = MemberDataKey::Member(member_addr.clone());
        let mut member: Member = env.storage().instance().get(&key).unwrap_or_else(|| {
            panic!("Member does not exist");
        });
        
        // Update DAO settings
        let mut settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        settings.total_voting_power = settings.total_voting_power - member.voting_power + new_voting_power;
        
        // Update member
        member.voting_power = new_voting_power;
        
        // Store updates
        env.storage().instance().set(&key, &member);
        env.storage().instance().set(&DAO_SETTINGS, &settings);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Updated voting power for {:?} to {}", member_addr, new_voting_power);
    }
    
    // Deactivate a member (doesn't remove them)
    pub fn deactivate_member(env: Env, member_addr: Address) {
        // Only admin can deactivate members
        let admin: Address = env.storage().instance().get(&DAO_ADMIN).unwrap();
        admin.require_auth();
        
        // Get existing member
        let key = MemberDataKey::Member(member_addr.clone());
        let mut member: Member = env.storage().instance().get(&key).unwrap_or_else(|| {
            panic!("Member does not exist");
        });
        
        // Update DAO settings
        let mut settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        settings.total_voting_power -= member.voting_power;
        
        // Update member
        member.is_active = false;
        member.voting_power = 0;
        
        // Store updates
        env.storage().instance().set(&key, &member);
        env.storage().instance().set(&DAO_SETTINGS, &settings);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Deactivated member: {:?}", member_addr);
    }
    
    // Create a new proposal
    pub fn create_proposal(env: Env, proposer: Address, title: String, description: String) -> u64 {
        // Require authorization from the proposer
        proposer.require_auth();
        
        // Check that proposer is a member with sufficient voting power
        let member_key = MemberDataKey::Member(proposer.clone());
        let member: Member = env.storage().instance().get(&member_key).unwrap_or_else(|| {
            panic!("Only members can create proposals");
        });
        
        if !member.is_active {
            panic!("Member is not active");
        }
        
        let settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        
        if member.voting_power < settings.proposal_threshold {
            panic!("Insufficient voting power to create proposal");
        }
        
        // Generate new proposal ID
        let proposal_id = settings.proposal_count + 1;
        
        // Create and store the proposal
        let current_time = env.ledger().timestamp();
        let proposal = Proposal {
            id: proposal_id,
            title,
            description,
            proposer: proposer.clone(),
            creation_time: current_time,
            voting_ends_at: current_time + settings.voting_period,
            status: ProposalStatus::Active,
            for_votes: 0,
            against_votes: 0,
            abstain_votes: 0,
            is_executed: false,
            execution_time: 0,
        };
        
        // Update proposal count in settings
        let mut updated_settings = settings;
        updated_settings.proposal_count = proposal_id;
        
        // Store proposal and updated settings
        env.storage().instance().set(&ProposalDataKey::Proposal(proposal_id), &proposal);
        env.storage().instance().set(&DAO_SETTINGS, &updated_settings);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Proposal {} created by {:?}", proposal_id, proposer);
        
        proposal_id
    }
    
    // Cast a vote on a proposal
    pub fn cast_vote(env: Env, voter: Address, proposal_id: u64, vote: Vote) {
        // Require authorization from the voter
        voter.require_auth();
        
        // Check that voter is an active member
        let member_key = MemberDataKey::Member(voter.clone());
        let member: Member = env.storage().instance().get(&member_key).unwrap_or_else(|| {
            panic!("Only members can vote");
        });
        
        if !member.is_active {
            panic!("Member is not active");
        }
        
        // Get the proposal
        let proposal_key = ProposalDataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env.storage().instance().get(&proposal_key).unwrap_or_else(|| {
            panic!("Proposal does not exist");
        });
        
        // Check if proposal is still active
        if env.ledger().timestamp() > proposal.voting_ends_at {
            panic!("Voting period has ended");
        }
        
        match proposal.status {
            ProposalStatus::Active => {},
            _ => panic!("Proposal is not active"),
        }
        
        // Check if member has already voted
        let vote_key = VoteDataKey::Vote(proposal_id, voter.clone());
        if env.storage().instance().has(&vote_key) {
            panic!("Member has already voted");
        }
        
        // Record the vote
        env.storage().instance().set(&vote_key, &vote);
        
        // Update vote counts
        match vote {
            Vote::For => proposal.for_votes += member.voting_power,
            Vote::Against => proposal.against_votes += member.voting_power,
            Vote::Abstain => proposal.abstain_votes += member.voting_power,
        }
        
        // Store updated proposal
        env.storage().instance().set(&proposal_key, &proposal);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Vote cast on proposal {} by {:?}", proposal_id, voter);
    }
    
    // Finalize proposal after voting period ends
    pub fn finalize_proposal(env: Env, proposal_id: u64) {
        // Get the proposal
        let proposal_key = ProposalDataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env.storage().instance().get(&proposal_key).unwrap_or_else(|| {
            panic!("Proposal does not exist");
        });
        
        // Check if voting period has ended
        let current_time = env.ledger().timestamp();
        if current_time <= proposal.voting_ends_at {
            panic!("Voting period has not ended yet");
        }
        
        // Check if proposal is still active
        match proposal.status {
            ProposalStatus::Active => {},
            _ => panic!("Proposal has already been finalized"),
        }
        
        // Get settings
        let settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        
        // Calculate total votes
        let total_votes = proposal.for_votes + proposal.against_votes + proposal.abstain_votes;
        
        // Check quorum
        let quorum_threshold = (settings.total_voting_power * settings.quorum) / 10000;
        if total_votes < quorum_threshold {
            proposal.status = ProposalStatus::Failed;
            log!(&env, "Proposal {} failed due to insufficient quorum", proposal_id);
        } else if proposal.for_votes > proposal.against_votes {
            proposal.status = ProposalStatus::Passed;
            log!(&env, "Proposal {} passed", proposal_id);
        } else {
            proposal.status = ProposalStatus::Failed;
            log!(&env, "Proposal {} failed", proposal_id);
        }
        
        // Store updated proposal
        env.storage().instance().set(&proposal_key, &proposal);
        
        env.storage().instance().extend_ttl(10000, 10000);
    }
    
    // Execute a passed proposal
    pub fn execute_proposal(env: Env, proposal_id: u64) {
        // Get the proposal
        let proposal_key = ProposalDataKey::Proposal(proposal_id);
        let mut proposal: Proposal = env.storage().instance().get(&proposal_key).unwrap_or_else(|| {
            panic!("Proposal does not exist");
        });
        
        // Check if proposal is passed
        match proposal.status {
            ProposalStatus::Passed => {},
            _ => panic!("Only passed proposals can be executed"),
        }
        
        // Check if already executed
        if proposal.is_executed {
            panic!("Proposal has already been executed");
        }
        
        // Get settings
        let settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        
        // Check if execution delay has passed
        let current_time = env.ledger().timestamp();
        let execution_time = proposal.voting_ends_at + settings.execution_delay;
        
        if current_time < execution_time {
            panic!("Execution delay has not passed yet");
        }
        
        // Mark as executed
        proposal.is_executed = true;
        proposal.execution_time = current_time;
        proposal.status = ProposalStatus::Executed;
        
        // Store updated proposal
        env.storage().instance().set(&proposal_key, &proposal);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Proposal {} executed", proposal_id);
    }
    
    // Update DAO settings (only admin)
    pub fn update_dao_settings(
        env: Env,
        proposal_threshold: u64,
        quorum: u64,
        voting_period: u64,
        execution_delay: u64
    ) {
        // Only admin can update settings
        let admin: Address = env.storage().instance().get(&DAO_ADMIN).unwrap();
        admin.require_auth();
        
        // Verify parameters
        if quorum > 10000 {  // quorum is in basis points (10000 = 100%)
            panic!("Quorum must be <= 10000");
        }
        
        // Get current settings
        let mut settings: DAOSettings = env.storage().instance().get(&DAO_SETTINGS).unwrap();
        
        // Update settings
        settings.proposal_threshold = proposal_threshold;
        settings.quorum = quorum;
        settings.voting_period = voting_period;
        settings.execution_delay = execution_delay;
        
        // Store updated settings
        env.storage().instance().set(&DAO_SETTINGS, &settings);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "DAO settings updated");
    }
    
    // Get proposal by ID
    pub fn get_proposal(env: Env, proposal_id: u64) -> Proposal {
        let proposal_key = ProposalDataKey::Proposal(proposal_id);
        env.storage().instance().get(&proposal_key).unwrap_or_else(|| {
            panic!("Proposal does not exist");
        })
    }
    
    // Get member by address
    pub fn get_member(env: Env, member_addr: Address) -> Member {
        let member_key = MemberDataKey::Member(member_addr);
        env.storage().instance().get(&member_key).unwrap_or_else(|| {
            panic!("Member does not exist");
        })
    }
    
    // Get current DAO settings
    pub fn get_dao_settings(env: Env) -> DAOSettings {
        env.storage().instance().get(&DAO_SETTINGS).unwrap()
    }
    
    // Get member's vote on a specific proposal
    pub fn get_vote(env: Env, proposal_id: u64, voter: Address) -> Option<Vote> {
        let vote_key = VoteDataKey::Vote(proposal_id, voter);
        if env.storage().instance().has(&vote_key) {
            Some(env.storage().instance().get(&vote_key).unwrap())
        } else {
            None
        }
    }
    
    // Transfer admin rights to a new address
    pub fn transfer_admin(env: Env, new_admin: Address) {
        // Only current admin can transfer rights
        let current_admin: Address = env.storage().instance().get(&DAO_ADMIN).unwrap();
        current_admin.require_auth();
        
        // Set new admin
        env.storage().instance().set(&DAO_ADMIN, &new_admin);
        
        env.storage().instance().extend_ttl(10000, 10000);
        log!(&env, "Admin transferred from {:?} to {:?}", current_admin, new_admin);
    }
}
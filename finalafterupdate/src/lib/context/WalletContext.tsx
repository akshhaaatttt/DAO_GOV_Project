
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isConnected, isAllowed, setAllowed, getAddress, signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from 'stellar-sdk';
import { createMember, getMemberByAddress, updateProposal } from '@/lib/stellar/soroban';
import { useToast } from '@/hooks/use-toast';

interface WalletContextType {
  isWalletConnected: boolean;
  publicKey: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isMember: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  registerAsMember: () => Promise<boolean>;
  payProposalFee: () => Promise<boolean>;
  voteOnProposal: (proposalId: string, voteType: 'For' | 'Against' | 'Abstain', votingPower: number) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType>({
  isWalletConnected: false,
  publicKey: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isMember: false,
  isAdmin: false,
  isLoading: false,
  registerAsMember: async () => false,
  payProposalFee: async () => false,
  voteOnProposal: async () => false,
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

// Create Stellar server using the SDK 
// Use alternate approach to create server instance
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      console.log("Checking wallet connection...");
      
      // First check if Freighter is connected
      const connectedResult = await isConnected();
      if (!connectedResult.isConnected) {
        console.log("Freighter is not connected");
        setIsWalletConnected(false);
        setPublicKey(null);
        return;
      }

      // Then check if our app is allowed
      const allowedResult = await isAllowed();
      setIsWalletConnected(allowedResult.isAllowed);
      console.log("Freighter connection status:", allowedResult.isAllowed);

      if (allowedResult.isAllowed) {
        try {
          // Get the public key if connected
          const addressResult = await getAddress();
          if (addressResult.error) {
            throw new Error(addressResult.error);
          }
          
          const address = addressResult.address;
          console.log("Connected wallet address:", address);
          setPublicKey(address);
          
          // Check if the user is a member
          const member = await getMemberByAddress(address);
          setIsMember(!!member);
          
          // Check if the user is an admin (example admin address)
          setIsAdmin(address === 'GCO2T3PNZV6WGCH6EOZGL7WRRJ676N2AFP5ZOUFEX7KFXHRLAOEZHYMZ');
        } catch (error) {
          console.error("Error getting wallet address:", error);
          setPublicKey(null);
        }
      }
    } catch (error) {
      console.error('Error in checkWalletConnection:', error);
      setIsWalletConnected(false);
      setPublicKey(null);
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      console.log("Attempting to connect to wallet...");

      // Request connection to the wallet
      const allowedResult = await setAllowed();
      if (!allowedResult.isAllowed) {
        toast({
          title: 'Connection failed',
          description: 'User rejected the connection request',
          variant: 'destructive',
        });
        return;
      }
      
      // Get the public key after successful connection
      const addressResult = await getAddress();
      if (addressResult.error) {
        throw new Error(addressResult.error);
      }
      
      const address = addressResult.address;
      console.log("Successfully connected to address:", address);
      
      setPublicKey(address);
      setIsWalletConnected(true);
      
      // Check if the user is a member
      const member = await getMemberByAddress(address);
      setIsMember(!!member);
      
      // Check if the user is an admin (example admin address)
      setIsAdmin(address === 'GCO2T3PNZV6WGCH6EOZGL7WRRJ676N2AFP5ZOUFEX7KFXHRLAOEZHYMZ');
      
      toast({
        title: 'Wallet connected',
        description: 'Your wallet has been connected successfully',
      });
    } catch (error) {
      console.error('Error in connectWallet:', error);
      toast({
        title: 'Connection failed',
        description: 'Error connecting to Freighter wallet',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setPublicKey(null);
    setIsMember(false);
    setIsAdmin(false);
    
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  // Function to create a payment transaction
  const createPaymentTransaction = async (amount: number, destination: string) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get sender account details
      const account = await server.loadAccount(publicKey);
      
      // Define the DAO treasury account where the funds will go
      const daoTreasury = destination || 'GBCRV3TYDJMLRAE6WJNLQTVKDPYRIY5SCNB6SE4P5K3XM5G2ZSSXBB5A'; // Example DAO treasury address
      
      // Create a payment transaction
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: "100000", // 0.01 XLM fee
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
      .addOperation(StellarSdk.Operation.payment({
        destination: daoTreasury,
        asset: StellarSdk.Asset.native(), // XLM
        amount: amount.toString()
      }))
      .setTimeout(30)
      .build();
      
      // Serialize the transaction for signing
      const txXDR = transaction.toXDR();
      
      // Request signature from Freighter wallet
      const signResult = await signTransaction(txXDR, { networkPassphrase: StellarSdk.Networks.TESTNET });
      
      if (signResult.error) {
        throw new Error(signResult.error);
      }
      
      // Submit the signed transaction to the network
      const tx = StellarSdk.TransactionBuilder.fromXDR(signResult.signedTxXdr, StellarSdk.Networks.TESTNET);
      const txResult = await server.submitTransaction(tx);
      
      console.log('Transaction successful:', txResult);
      return true;
    } catch (error) {
      console.error('Error creating/submitting transaction:', error);
      throw error;
    }
  };

  const registerAsMember = async (): Promise<boolean> => {
    if (!isWalletConnected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // First attempt the payment transaction of 10 XLM
      try {
        await createPaymentTransaction(10, 'GBCRV3TYDJMLRAE6WJNLQTVKDPYRIY5SCNB6SE4P5K3XM5G2ZSSXBB5A');
      } catch (error) {
        console.error('Payment transaction failed:', error);
        toast({
          title: 'Payment failed',
          description: 'The membership fee payment was not completed',
          variant: 'destructive',
        });
        return false;
      }
      
      // If payment was successful, register as a member
      const newMember = await createMember({
        address: publicKey,
        votingPower: 100,
        proposalsCreated: 0,
        votesParticipated: 0,
        status: 'Active',
      });
      
      console.log("Member created successfully:", newMember);
      
      setIsMember(true);
      toast({
        title: 'Registration successful',
        description: 'You are now a member of the DAO',
      });
      
      return true;
    } catch (error) {
      console.error('Error registering as member:', error);
      toast({
        title: 'Registration failed',
        description: 'Failed to register as a member',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const payProposalFee = async (): Promise<boolean> => {
    if (!isWalletConnected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Attempt to pay the 5 XLM proposal fee
      try {
        await createPaymentTransaction(5, 'GBCRV3TYDJMLRAE6WJNLQTVKDPYRIY5SCNB6SE4P5K3XM5G2ZSSXBB5A');
      } catch (error) {
        console.error('Proposal fee payment failed:', error);
        toast({
          title: 'Payment failed',
          description: 'The proposal fee payment was not completed',
          variant: 'destructive',
        });
        return false;
      }
      
      toast({
        title: 'Payment successful',
        description: 'Proposal fee has been paid',
      });
      
      return true;
    } catch (error) {
      console.error('Error paying proposal fee:', error);
      toast({
        title: 'Payment failed',
        description: 'Failed to pay proposal fee',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const voteOnProposal = async (
    proposalId: string, 
    voteType: 'For' | 'Against' | 'Abstain',
    votingPower: number
  ): Promise<boolean> => {
    if (!isWalletConnected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // Small transaction fee for voting (0.5 XLM)
      try {
        await createPaymentTransaction(0.5, 'GBCRV3TYDJMLRAE6WJNLQTVKDPYRIY5SCNB6SE4P5K3XM5G2ZSSXBB5A');
      } catch (error) {
        console.error('Vote transaction fee payment failed:', error);
        toast({
          title: 'Payment failed',
          description: 'The voting fee payment was not completed',
          variant: 'destructive',
        });
        return false;
      }
      
      // After payment is successful, update the proposal vote counts
      const updateData: any = {};
      
      if (voteType === 'For') {
        updateData.forVotes = votingPower;
      } else if (voteType === 'Against') {
        updateData.againstVotes = votingPower;
      } else {
        updateData.abstainVotes = votingPower;
      }
      
      await updateProposal(proposalId, updateData);
      
      toast({
        title: 'Vote successful',
        description: `Your ${voteType.toLowerCase()} vote has been cast`,
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: 'Vote failed',
        description: 'Failed to submit your vote',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider value={{
      isWalletConnected,
      publicKey,
      connectWallet,
      disconnectWallet,
      isMember,
      isAdmin,
      isLoading,
      registerAsMember,
      payProposalFee,
      voteOnProposal,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

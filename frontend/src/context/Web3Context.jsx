import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from '../contracts/contractConfig.json';

const Web3Context = createContext(null);

const TARGET_CHAIN_ID = contractConfig.chainId || 31337;
const TARGET_CHAIN_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`;

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState(contractConfig.adminAddress || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(null);

  // Initialize read-only contract for querying even when wallet is not connected
  useEffect(() => {
    try {
      const rpcUrl = 'http://127.0.0.1:8545';
      const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);
      const readContract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        jsonRpcProvider
      );
      setReadOnlyContract(readContract);
    } catch (err) {
      console.warn('Could not initialize read-only JSON-RPC provider:', err.message);
    }
  }, []);

  // Update admin status
  const checkAdminStatus = useCallback(async (userAddress, contractInstance) => {
    try {
      if (!contractInstance || !userAddress) {
        setIsAdmin(false);
        return;
      }
      const onChainAdmin = await contractInstance.admin();
      setAdminAddress(onChainAdmin);
      const match = userAddress.toLowerCase() === onChainAdmin.toLowerCase();
      setIsAdmin(match);
    } catch (err) {
      console.error('Error checking admin status:', err);
      // Fallback to configured admin address
      if (contractConfig.adminAddress && userAddress) {
        setIsAdmin(userAddress.toLowerCase() === contractConfig.adminAddress.toLowerCase());
      }
    }
  }, []);

  // Initialize contract with signer
  const setupSigner = useCallback(async (browserProvider, userAddress) => {
    try {
      const signer = await browserProvider.getSigner();
      const contractInstance = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        signer
      );
      setContract(contractInstance);
      await checkAdminStatus(userAddress, contractInstance);
    } catch (err) {
      console.error('Error setting up signer contract:', err);
      setError('Failed to initialize contract with connected account.');
    }
  }, [checkAdminStatus]);

  // Connect wallet
  const connectWallet = async () => {
    setError('');
    if (!window.ethereum) {
      setError('MetaMask is not detected. Please install MetaMask browser extension.');
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0];
        setAccount(userAddress);

        const network = await browserProvider.getNetwork();
        const currentChain = Number(network.chainId);
        setChainId(currentChain);

        await setupSigner(browserProvider, userAddress);
      }
    } catch (err) {
      console.error('Connection error:', err);
      if (err.code === 4001) {
        setError('Connection rejected by user in MetaMask.');
      } else {
        setError(err.message || 'Failed to connect wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch or Add Localhost Network in MetaMask
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      setError('');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_CHAIN_HEX }],
      });
    } catch (switchError) {
      // 4902 indicates chain has not been added yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: TARGET_CHAIN_HEX,
                chainName: 'Hardhat Localhost',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['http://127.0.0.1:8545'],
              },
            ],
          });
        } catch (addError) {
          setError('Failed to add Hardhat local network to MetaMask: ' + addError.message);
        }
      } else {
        setError('Failed to switch network: ' + switchError.message);
      }
    }
  };

  // Listen to MetaMask account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setAccount(newAccount);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        await setupSigner(browserProvider, newAccount);
      } else {
        setAccount('');
        setContract(null);
        setIsAdmin(false);
      }
    };

    const handleChainChanged = (chainHex) => {
      const newChainId = parseInt(chainHex, 16);
      setChainId(newChainId);
      // Reload is standard best practice for web3 state consistency
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already authorized
    const checkInitialConnection = async () => {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_accounts', []);
        if (accounts.length > 0) {
          const userAddress = accounts[0];
          setAccount(userAddress);
          const network = await browserProvider.getNetwork();
          setChainId(Number(network.chainId));
          setProvider(browserProvider);
          await setupSigner(browserProvider, userAddress);
        }
      } catch (e) {
        console.warn('Initial connection probe failed:', e);
      }
    };

    checkInitialConnection();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [setupSigner]);

  const isCorrectNetwork = chainId === TARGET_CHAIN_ID;
  const activeContract = contract || readOnlyContract;

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        targetChainId: TARGET_CHAIN_ID,
        isCorrectNetwork,
        contract: activeContract,
        signerContract: contract,
        provider,
        isAdmin,
        adminAddress,
        isConnecting,
        error,
        connectWallet,
        switchNetwork,
        contractAddress: contractConfig.address,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

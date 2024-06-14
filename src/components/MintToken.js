import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI from './ABI.json';

const abi = ABI.abi;

const MintToken = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const initialize = async () => {
        try {
          // 1. Request wallet connection
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          // 2. Create a provider
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);

          // 3. Get the signer (the connected wallet)
          const signer = await provider.getSigner();
          setSigner(signer);

          // 4. Get the connected account
          const account = await signer.getAddress();
          setAccount(account);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      };

      initialize();
    } else {
      console.error('MetaMask is not installed');
    }
  }, []);

  const mintTokens = async () => {
    if (!signer) {
      console.error("Wallet not connected");
      return;
    }

    // Replace with your contract ABI and address
    const contractAbi = abi;
    const contractAddress = "0xB1DAC663E09d61569443a6Ee0A8A273B22ef7892";

    // Create a contract instance
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);

    try {
      // Call the mint function
      const tx = await contract.mint(account, ethers.parseUnits('1', 18)); // Replace with your mint parameters
      await tx.wait();

      console.log(`Minted tokens to ${account}`);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  };

  return (
    <div>
      <button onClick={mintTokens}>
        Mint Tokens
      </button>
      {account && <p>Connected account: {account}</p>}
    </div>
  );
};

export default MintToken;
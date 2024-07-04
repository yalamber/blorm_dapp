import React, { useState } from 'react';
import { ethers } from 'ethers';
import blop8 from '../utils/Blop8.json';
import { Options } from '@layerzerolabs/lz-v2-utilities';

const Transfer = () => {
  const [eid, setEid] = useState('');
  const [peer, setPeer] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [dstEid, setDstEid] = useState('');
  const [status, setStatus] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');

  const handleSetPeer = async (event) => {
    event.preventDefault();
    setStatus('Processing setPeer...');

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractABI = blop8.abi;

      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const gasPriceFetched = (await provider.getFeeData()).gasPrice;
      const overrides = {
        gasLimit: 5000000, // Adjust the gas limit as needed
        gasPrice: gasPriceFetched, // Adjust the gas    price as needed
      };

      const tx = await contract.setTrustedRemoteAddress(parseInt(eid), ethers.id(peer), overrides);
      await tx.wait();

      setStatus('setPeer transaction successful!');
    } catch (error) {
      console.error(error);
      setStatus('setPeer transaction failed!');
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    setStatus('Processing transfer...');
  
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      const contractABI = blop8.abi;
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      console.log('contract:', contract);
  
      // Ensure that adapterParams are correctly encoded
      const adapterParams = ethers.solidityPacked(
        ['uint16', 'uint256'],
        [1, 200000]
      );
  
      const zroPaymentAddress = ethers.ZeroAddress; // Set to address(0x0)
  
      const gasPriceFetched = (await provider.getFeeData()).gasPrice;
      const overrides = {
        gasLimit: 600000, // Adjust the gas limit as needed
        gasPrice: gasPriceFetched, // Adjust the gas price as needed
      };
  
      let mintFee = ethers.parseEther('0');
  
      console.log('sending with:', userAddress, dstEid, destAddress, tokenId, userAddress, zroPaymentAddress, adapterParams, mintFee, overrides);
  
      const tx = await contract.sendFrom(
        userAddress, 
        BigInt(parseInt(dstEid)), 
        destAddress, 
        BigInt(parseInt(tokenId)), 
        userAddress, 
        zroPaymentAddress, 
        adapterParams,
        { value: mintFee, ...overrides }
      );
      await tx.wait();
      console.log('Transaction details:', tx);
      setStatus('Transaction successful!');
    } catch (error) {
      console.error("Transaction failed:", error);
      setStatus('Transaction failed!');
    }
  };
  

  return (
    <div>
      <h1>Transfer</h1>
      <h2>Sepolia: 0x6eF926794f5193b3725BeAA60584756217f5CB52 . Sepolia 2: 0xB45F80d607D7B1b5acB83215ea4630c615744f48</h2>
      Contract Address:
      <input type="text" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} required />
      User Address:
      <input type="text" value={userAddress} onChange={(e) => setUserAddress(e.target.value)} required />
      <form onSubmit={handleSetPeer}>
        <div>
          <label>
            EID:
            <input
              type="text"
              value={eid}
              onChange={(e) => setEid(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Peer:
            <input
              type="text"
              value={peer}
              onChange={(e) => setPeer(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Set Peer</button>
      </form>

      <form onSubmit={handleSend}>
        <div>
          <label>
            Token ID:
            <input
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Destination EID:
            <input
              type="text"
              value={dstEid}
              onChange={(e) => setDstEid(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Destination Address:
            <input
              type="text"
              value={destAddress}
              onChange={(e) => setDestAddress(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Transfer</button>
      </form>
      <div>{status}</div>

    </div>
  );
};

export default Transfer;

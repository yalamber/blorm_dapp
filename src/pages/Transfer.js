import React, { useState } from 'react';
import { ethers } from 'ethers';
import abi from '../utils/Blop5.json';

const Transfer = () => {
  const [eid, setEid] = useState('');
  const [peer, setPeer] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [minAmountLD, setMinAmountLD] = useState('');
  const [dstEid, setDstEid] = useState('');
  const [status, setStatus] = useState('');

  const handleSetPeer = async (event) => {
    event.preventDefault();
    setStatus('Processing setPeer...');

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractAddress = '0xDBDba1E824c8F6030B48b7626e6220631f635d63';
      const contractABI = abi.abi;

      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.setPeer(parseInt(eid), ethers.id(peer));
      await tx.wait();

      setStatus('setPeer transaction successful!');
    } catch (error) {
      console.error(error);
      setStatus('setPeer transaction failed!');
    }
  };

  const handleCrossChainTransfer = async (event) => {
    event.preventDefault();
    setStatus('Processing crossChainTransfer...');

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractAddress = '0xDBDba1E824c8F6030B48b7626e6220631f635d63';
      const contractABI = abi.abi;

      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const destAddress = ethers.hexlify('0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B');

      const tx = await contract.crossChainTransfer(destAddress, parseInt(tokenId), BigInt(minAmountLD), parseInt(dstEid), { value: ethers.parseEther('0.01') });
      await tx.wait();

      setStatus('crossChainTransfer transaction successful!');
    } catch (error) {
      console.error(error);
      setStatus('crossChainTransfer transaction failed!');
    }
  };

  return (
    <div>
      <h1>Transfer</h1>
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

      <form onSubmit={handleCrossChainTransfer}>
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
            Min Amount LD:
            <input
              type="text"
              value={minAmountLD}
              onChange={(e) => setMinAmountLD(e.target.value)}
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
        <button type="submit">Cross Chain Transfer</button>
      </form>
      <div>{status}</div>
    </div>
  );
};

export default Transfer;

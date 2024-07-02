import React, { useState } from 'react';
import { ethers } from 'ethers';
import blop6 from '../utils/Blop7.json';
import { Options } from '@layerzerolabs/lz-v2-utilities';

const Transfer = () => {
  const [eid, setEid] = useState('');
  const [peer, setPeer] = useState('');
  const [tokenId, setTokenId] = useState('200');
  const [dstEid, setDstEid] = useState('40161');
  const [status, setStatus] = useState('');
  const [contractAddress, setContractAddress] = useState('0x966E5DC04A6EB78EF8b1FD6E5CD56b447ee40669');
  const [userAddress, setUserAddress] = useState('0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B');
  const [destAddress, setDestAddress] = useState('0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B');

  const handleSetPeer = async (event) => {
    event.preventDefault();
    setStatus('Processing setPeer...');

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractABI = blop6.abi;

      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const gasPriceFetched = (await provider.getFeeData()).gasPrice;
      const overrides = {
        gasLimit: 5000000, // Adjust the gas limit as needed
        gasPrice: gasPriceFetched, // Adjust the gas    price as needed
      };

      const tx = await contract.setPeer(parseInt(eid), ethers.id(peer), overrides);
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

      const contractABI = blop6.abi;
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const GAS_LIMIT = BigInt(6000000); // Gas limit for the executor
      const MSG_VALUE = BigInt(0); // msg.value for the lzReceive() function on destination in wei

      const _options = Options.newOptions().addExecutorLzReceiveOption(GAS_LIMIT, MSG_VALUE);

      const tokenURI = await contract.tokenURI(BigInt(tokenId));

      console.log('tokenURI:', tokenURI);

      const destinationAddressFormatted = ethers.zeroPadValue(destAddress, 32); // ethers.toBeHex(

      const extraOptionsFormatted = _options.toBytes();

      const sendParams = {
        dstEid: parseInt(dstEid),
        to: destinationAddressFormatted,
        tokenID: BigInt(parseInt(tokenId)),
        tokenURI: tokenURI,
        extraOptions: extraOptionsFormatted
      };

      const gasPriceFetched = (await provider.getFeeData()).gasPrice;

      const _payInLzToken = false; // Change this based on your requirement

      console.log('quoting with:', parseInt(dstEid), sendParams, extraOptionsFormatted, _payInLzToken);

      const [nativeFee, lzTokenFee] = await contract.quote(parseInt(dstEid), sendParams, extraOptionsFormatted, _payInLzToken);

      const MessagingFee = {
        nativeFee: nativeFee,
        lzTokenFee: lzTokenFee,
      };

      const overrides = {
        gasLimit: 10000000, // Adjust the gas limit as needed
        gasPrice: gasPriceFetched, // Adjust the gas    price as needed
      };

      console.log('sending with:', sendParams, MessagingFee, userAddress, overrides);

      const tx = await contract.send(sendParams, MessagingFee, userAddress, overrides);
      await tx.wait();

      setStatus('Transaction successful!');
    } catch (error) {
      console.error("Transaction failed:", error);
      setStatus('Transaction failed!');
    }
  }


  return (
    <div>
      <h1>Transfer</h1>
      <h2>Sepolia: 0x6f59ED15685DA48d20294D2d2313E45cDAC4a5CC . Base Sepolia: 0x966E5DC04A6EB78EF8b1FD6E5CD56b447ee40669</h2>
      <input type="text" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} required />
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

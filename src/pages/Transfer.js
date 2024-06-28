import React, { useState } from 'react';
import { ethers } from 'ethers';
import blop6 from '../utils/Blop6.json';
import { Options } from '@layerzerolabs/lz-v2-utilities';

const Transfer = () => {
  const [eid, setEid] = useState('');
  const [peer, setPeer] = useState('');
  const [tokenId, setTokenId] = useState('100');
  const [dstEid, setDstEid] = useState('40245');
  const [status, setStatus] = useState('');
  const [contractAddress, setContractAddress] = useState('0x3830D9A6a9CfF25D731e74623c0aE722860C9b1e');
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
        tokenID: parseInt(tokenId),
        tokenURI: tokenURI,
        extraOptions: extraOptionsFormatted
      };

      const MessagingFee = {
        nativeFee: 70003585193925,
        lzTokenFee: 0,
      };

      const gasPriceFetched = (await provider.getFeeData()).gasPrice;

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

  const [quoteDstEid, setQuoteDstEid] = useState('40245');
  const [quoteTokenId, setQuoteTokenId] = useState('100');
  const [quoteResult, setQuoteResult] = useState('');

  const handleQuote = async (event) => {
    event.preventDefault();
    setStatus('Fetching quote...');

    try {
      console.log('quoteDstEid:', quoteDstEid, 'quoteTokenId:', quoteTokenId);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contractABI = blop6.abi;
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tokenURI = await contract.tokenURI(BigInt(quoteTokenId));

      const destinationAddressFormatted = ethers.zeroPadValue(destAddress, 32); // ethers.toBeHex(

      const GAS_LIMIT = BigInt(6000000); // Adjust as needed
      const MSG_VALUE = BigInt(0); // Adjust as needed
      const _options = await Options.newOptions().addExecutorLzReceiveOption(GAS_LIMIT, MSG_VALUE);
      const extraOptionsFormatted = _options.toBytes();

      const sendParams = {
        dstEid: parseInt(dstEid),
        to: destinationAddressFormatted,
        tokenID: parseInt(tokenId),
        tokenURI: tokenURI,
        extraOptions: extraOptionsFormatted
      };

      const _payInLzToken = false; // Change this based on your requirement

      console.log('quoting with:', quoteDstEid, sendParams, _options.toBytes(), _payInLzToken);

      const [nativeFee, lzTokenFee] = await contract.quote(parseInt(quoteDstEid), sendParams, _options.toBytes(), _payInLzToken);

      setQuoteResult(`Native Fee: ${nativeFee.toString()}, LZ Token Fee: ${lzTokenFee.toString()}`);
      setStatus('Quote fetched successfully!');
    } catch (error) {
      console.error("Quote fetching failed:", error);
      setStatus('Quote fetching failed!');
    }
  };



  return (
    <div>
      <h1>Transfer</h1>
      <h2>Sepolia: 0x3830D9A6a9CfF25D731e74623c0aE722860C9b1e . Base Sepolia: 0x0f60648Aa233a0e1884f2684aA6a0BD6eB9e085b</h2>
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
      <form onSubmit={handleQuote}>
        <div>
          <label>
            Destination EID:
            <input
              type="text"
              value={quoteDstEid}
              onChange={(e) => setQuoteDstEid(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Token ID:
            <input
              type="text"
              value={quoteTokenId}
              onChange={(e) => setQuoteTokenId(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Get Quote</button>
      </form>
      <div>{quoteResult}</div>

    </div>
  );
};

export default Transfer;

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import OFT20ABI from './ABI.json';
import { Options } from '@layerzerolabs/lz-v2-utilities';

const oft20abi = OFT20ABI.abi;

function Transfer() {
  const [contractAddress, setContractAddress] = useState('0x39aD3a8008ED51aEDFD3267aEBCdd824B0869aE8');
  const [eid, setEid] = useState('40161');
  const [peerAddress, setPeerAddress] = useState('0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B');
  const [amountLD, setAmountLD] = useState(3);
  const [minAmountLD, setMinAmountLD] = useState(2);
  const [extraOptions, setExtraOptions] = useState('');
  const [composeMsg, setComposeMsg] = useState('');
  const [oftCmd, setOftCmd] = useState('');
  const [payInLzToken, setPayInLzToken] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      const signer = await browserProvider.getSigner();
      setSigner(signer);
      try {
        const accounts = await signer.getAddress();
        console.log(`Connected account: ${accounts}`);
      } catch (err) {
        console.error('Error connecting to MetaMask:', err);
        setError('Failed to connect to MetaMask');
      }
    } else {
      console.error("MetaMask is not installed");
      setError("MetaMask is not installed");
    }
  };

  const buildOptions = () => {
    const GAS_LIMIT = 60000;
    const MSG_VALUE = 0;

    // Initialize options using the Options SDK
    const options = Options.newOptions().addExecutorLzReceiveOption(GAS_LIMIT, MSG_VALUE);
    return options.toBytes();
  };

  const handleQuoteSend = async (e) => {
    e.preventDefault();
    if (!signer) {
      setError('Web3 is not initialized. Ensure MetaMask is installed and connected.');
      return;
    }

    try {
      const contract = new ethers.Contract(contractAddress, oft20abi, signer);
      const extraOptionsBytes = buildOptions();
      const sendParam = {
        dstEid: parseInt(eid),
        to: ethers.zeroPadValue(peerAddress, 32),
        amountLD: ethers.parseUnits(amountLD.toString(), 9),
        minAmountLD: ethers.parseUnits(minAmountLD.toString(), 9),
        extraOptions: extraOptionsBytes,
        composeMsg: ethers.hexlify(ethers.getBytes(new TextEncoder().encode(composeMsg))),
        oftCmd: ethers.hexlify(ethers.getBytes(new TextEncoder().encode(oftCmd)))
      };

      console.log('sendParam:', sendParam);
      console.log('payInLzToken:', payInLzToken);

      const result = await contract.quoteSend(sendParam, false);
      console.log('quoteSend result:', result);

      setQuoteResult(result);
      setError(null);
    } catch (err) {
      console.error('Error calling quoteSend:', err);
      setError(`Error calling quoteSend: ${err.message}`);
      setQuoteResult(null);
    }
  };

  return (
    <div className="container">
      <h1>OFT Transfer</h1>
      <button onClick={handleConnectWallet}>Connect to MetaMask</button>
      <form onSubmit={handleQuoteSend}>
        <div>
          <label>Contract Address:</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Endpoint ID (EID):</label>
          <input
            type="number"
            value={eid}
            onChange={(e) => setEid(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Peer Address:</label>
          <input
            type="text"
            value={peerAddress}
            onChange={(e) => setPeerAddress(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Amount (LD):</label>
          <input
            type="text"
            value={amountLD}
            onChange={(e) => setAmountLD(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Min Amount (LD):</label>
          <input
            type="text"
            value={minAmountLD}
            onChange={(e) => setMinAmountLD(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Extra Options:</label>
          <input
            type="text"
            value={extraOptions}
            onChange={(e) => setExtraOptions(e.target.value)}
          />
        </div>
        <div>
          <label>Compose Msg:</label>
          <input
            type="text"
            value={composeMsg}
            onChange={(e) => setComposeMsg(e.target.value)}
          />
        </div>
        <div>
          <label>OFT Command:</label>
          <input
            type="text"
            value={oftCmd}
            onChange={(e) => setOftCmd(e.target.value)}
          />
        </div>
        <div>
          <label>Pay in LZ Token:</label>
          <input
            type="checkbox"
            checked={payInLzToken}
            onChange={(e) => setPayInLzToken(e.target.checked)}
          />
        </div>
        <button type="submit">Get Quote</button>
      </form>
      {quoteResult && (
        <div>
          <h2>Quote Result:</h2>
          <p>Native Fee: {quoteResult.nativeFee.toString()}</p>
          <p>LZ Token Fee: {quoteResult.lzTokenFee.toString()}</p>
        </div>
      )}
      {error && (
        <div>
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default Transfer;

import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
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
  const [web3, setWeb3] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(accounts => console.log(`Connected account: ${accounts[0]}`))
        .catch(err => console.error(err));
    } else {
      console.error("MetaMask is not installed");
    }
  }, []);

  const buildOptions = () => {
    const GAS_LIMIT = 60000;
    const MSG_VALUE = 0;

    // Initialize options using the Options SDK
    const options = Options.newOptions().addExecutorLzReceiveOption(GAS_LIMIT, MSG_VALUE);
    return options.toHex();
  };

  const handleQuoteSend = async (e) => {
    e.preventDefault();
    if (!web3) {
      setError('Web3 is not initialized. Ensure MetaMask is installed and connected.');
      return;
    }

    try {
      const contract = new web3.eth.Contract(oft20abi, contractAddress);
      const extraOptions = buildOptions();
      const sendParam = {
        dstEid: parseInt(eid),
        to: web3.utils.padLeft(web3.utils.toHex(peerAddress), 64),
        amountLD: web3.utils.toWei(amountLD.toString(), 'gwei'),
        minAmountLD: web3.utils.toWei(minAmountLD.toString(), 'gwei'),
        extraOptions: web3.utils.toHex(extraOptions),
        composeMsg: web3.utils.toHex(composeMsg),
        oftCmd: web3.utils.toHex(oftCmd)
      };

      console.log('sendParam:', sendParam);
      console.log('payInLzToken:', payInLzToken);

      const result = await contract.methods.quoteSend(
        sendParam,
        payInLzToken
      ).call();

      console.log('quoteSend result:', result);

      setQuoteResult(result);
      setError(null);
    } catch (err) {
      console.error('Error calling quoteSend:', err);
      setError(err.message);
      setQuoteResult(null);
    }
  };

  return (
    <div className="container">
      <h1>OFT Transfer</h1>
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
          <p>Native Fee: {quoteResult.nativeFee}</p>
          <p>LZ Token Fee: {quoteResult.lzTokenFee}</p>
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

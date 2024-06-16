import React, { useState } from 'react';
import Web3 from 'web3';

const TokenURIFetcher = ({ contractAddress, contractABI }) => {
  const [tokenId, setTokenId] = useState('');
  const [tokenURI, setTokenURI] = useState('');
  const [error, setError] = useState('');

  const fetchTokenURI = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();

      const contract = new web3.eth.Contract(contractABI, contractAddress);

      const uri = await contract.methods.tokenURI(tokenId).call();
      setTokenURI(uri);
      setError('');
    } catch (err) {
      setError(err.message);
      setTokenURI('');
    }
  };

  return (
    <div>
      <h2>Fetch Token URI</h2>
      <input
        type="text"
        placeholder="Enter Token ID"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
      />
      <button onClick={fetchTokenURI}>Fetch Token URI</button>
      {tokenURI && (
        <div>
          <h3>Token URI:</h3>
          <p>{tokenURI}</p>
        </div>
      )}
      {error && (
        <div>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default TokenURIFetcher;

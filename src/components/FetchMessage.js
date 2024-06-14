import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getAddress, zeroPadValue } from 'ethers'; // Import necessary functions directly from ethers.

const FetchMessage = () => {
    const [contractAddress, setContractAddress] = useState('');
    const [peerChainId, setPeerChainId] = useState('');
    const [peerAddress, setPeerAddress] = useState('');
    const [network, setNetwork] = useState('');
    const [message, setMessage] = useState('');
    const [storedMessage, setStoredMessage] = useState(null);
    const [gasOptions, setGasOptions] = useState('0x0003010011010000000000000000000000000000ea60'); // Example gas options

    const networks = {
        baseSepolia: {
            chainId: 40245,
            rpcUrl: 'https://base-sepolia.infura.io/v3/01411a7b9c0a48e28adbc9d4e0c42176' // Mock RPC URL, replace with actual one
        },
        ethSepolia: {
            chainId: 11155111,
            rpcUrl: 'https://sepolia.infura.io/v3/01411a7b9c0a48e28adbc9d4e0c42176' // Mock RPC URL, replace with actual one
        },
    };

    const handleSendMessage = async () => {
        try {
            // Validate addresses
            getAddress(contractAddress);
            getAddress(peerAddress);

            const selectedNetwork = networks[network];

            if (!selectedNetwork) {
                alert('Please select a network.');
                return;
            }

            // Check if MetaMask is installed
            if (!window.ethereum) {
                alert('Please install MetaMask!');
                return;
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const contract = new ethers.Contract(contractAddress, [
                "function quote(uint32 _dstEid, string memory _message, bytes calldata _options, bool _payInLzToken) public view returns (uint256, uint256)",
                "function send(uint32 _dstEid, string memory _message, bytes calldata _options) external payable",
                "function data() view returns (string)"
            ], signer);

            // Quote the gas needed for the transaction
            const [nativeFee, lzTokenFee] = await contract.quote(peerChainId, message, gasOptions, false);

            // Send the transaction
            const tx = await contract.send(peerChainId, message, gasOptions, { value: nativeFee });
            await tx.wait();

            alert('Message sent successfully!');

            // Optionally fetch the stored message
            fetchStoredMessage();
            
        } catch (error) {
            console.error(error);
            if (error.code === 'INVALID_ARGUMENT') {
                alert('Please enter valid addresses.');
            } else {
                alert(`Failed to send message: ${error.message}`);
            }
        }
    };

    const fetchStoredMessage = async () => {
        try {
            const selectedNetwork = networks[network];
            const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl, selectedNetwork.chainId);
            const contract = new ethers.Contract(contractAddress, [
                "function data() view returns (string)"
            ], provider);

            const message = await contract.data();
            setStoredMessage(message);
        } catch (error) {
            alert(`Failed to fetch stored message: ${error.message}`);
        }
    };

    return (
        <div>
            <h2>Get Message</h2>
            <div>
                <label>Contract Address: </label>
                <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                />
            </div>
            <div>
                <label>Peer Chain ID: </label>
                <input
                    type="text"
                    value={peerChainId}
                    onChange={(e) => setPeerChainId(e.target.value)}
                />
            </div>
            <div>
                <label>Peer Address: </label>
                <input
                    type="text"
                    value={peerAddress}
                    onChange={(e) => setPeerAddress(e.target.value)}
                />
            </div>
            <div>
                <label>Network: </label>
                <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                    <option value="">Select Network</option>
                    <option value="baseSepolia">Base Sepolia</option>
                    <option value="ethSepolia">ETH Sepolia</option>
                </select>
            </div>
            <button onClick={fetchStoredMessage}>Fetch Stored Message</button>
            {storedMessage && (
                <div>
                    <h3>Stored Message:</h3>
                    <p>{storedMessage}</p>
                </div>
            )}
        </div>
    );
};

export default FetchMessage;
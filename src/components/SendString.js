import React, { useState } from 'react';
import { ethers } from 'ethers';

const SendString = () => {
    const [contractAddress, setContractAddress] = useState('');
    const [peerChainId, setPeerChainId] = useState('');
    const [peerAddress, setPeerAddress] = useState('');
    const [network, setNetwork] = useState('');
    const [message, setMessage] = useState('');
    const [gasOptions, setGasOptions] = useState('0x0003010011010000000000000000000000000000ea60'); // Example gas options

    const networks = {
        baseSepolia: {
            chainId: 40245,
            rpcUrl: 'https://base-sepolia.infura.io/v3/01411a7b9c0a48e28adbc9d4e0c42176' // Mock RPC URL, replace with actual one
        },
        ethSepolia: {
            chainId: 40161,
            rpcUrl: 'https://sepolia.infura.io/v3/01411a7b9c0a48e28adbc9d4e0c42176' // Mock RPC URL, replace with actual one
        },
    };

    const handleSendMessage = async () => {
        try {

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
                "function send(uint32 _dstEid, string memory _message, bytes calldata _options) external payable"
            ], signer);

            // Quote the gas needed for the transaction
            const [nativeFee, lzTokenFee] = await contract.quote(peerChainId, message, gasOptions, false);

            // Send the transaction
            const tx = await contract.send(peerChainId, message, gasOptions, { value: nativeFee });
            await tx.wait();

            console.log(tx.hash); // Transaction hash

            alert('Message sent successfully!');
        } catch (error) {
            console.error(error);
            if (error.code === 'INVALID_ARGUMENT') {
                alert('Please enter valid addresses.');
            } else {
                alert(`Failed to send message: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <h2>Send Message</h2>
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
                <label>Message: </label>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
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
            <button onClick={handleSendMessage}>Send Message</button>
        </div>
    );
};

export default SendString;

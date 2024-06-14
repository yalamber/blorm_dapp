
import React, { useState } from 'react';
import { ethers } from 'ethers';

const AddPeer = () => {
    const [contractAddress, setContractAddress] = useState('');
    const [peerChainId, setPeerChainId] = useState('');
    const [peerAddress, setPeerAddress] = useState('');
    const [network, setNetwork] = useState('');

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

    const handleAddPeer = async () => {
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
                "function setPeer(uint32 _eid, bytes32 _peer) public"
            ], signer);

            const tx = await contract.setPeer(peerChainId, ethers.zeroPadValue(peerAddress, 32));
            await tx.wait();

            console.log(tx.hash); // Transaction hash

            alert('Peer added successfully!');
        } catch (error) {
            if (error.code === 'INVALID_ARGUMENT') {
                alert('Please enter valid addresses.');
            } else {
                alert(`Failed to add peer: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <h2>Add Peer</h2>
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
            <button onClick={handleAddPeer}>Add Peer</button>
        </div>
    );
};

export default AddPeer;
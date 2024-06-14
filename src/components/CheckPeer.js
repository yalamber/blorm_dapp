import React, { useState } from 'react';
import { ethers } from 'ethers';
import ABI from './ABI.json';

// Replace with your contract ABI
const contractABI = ABI.abi;

const CheckPeer = () => {
    const [eid, setEid] = useState('');
    const [peer, setPeer] = useState('');
    const [result, setResult] = useState(null);
    const [contractAddress, setContractAddress] = useState('');

    const handleCheckPeer = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        // await provider.send('eth_requestAccounts', []);
        const contract = new ethers.Contract(contractAddress, contractABI, provider);

        try {
            console.log('Checking peer:', eid, peer)
            console.log(await contract.symbol());
            const isPeerSet = await contract.isPeer(parseInt(eid), ethers.zeroPadValue(peer, 32));
            console.log('Is peer set:', isPeerSet);
            setResult(isPeerSet ? 'Peer is set' : 'Peer is not set');
        } catch (error) {
            console.error('Error checking peer:', error);
            setResult('Error checking peer');
        }
    };

    return (
        <div>
            <h2>Check Peer</h2>
            <div>
                <label>
                    Contract Address:
                    <input
                        type="text"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                    />
                </label>
                <label>
                    Chain EID:
                    <input
                        type="text"
                        value={eid}
                        onChange={(e) => setEid(e.target.value)}
                    />
                </label>
            </div>
            <div>
                <label>
                    Peer Address:
                    <input
                        type="text"
                        value={peer}
                        onChange={(e) => setPeer(e.target.value)}
                    />
                </label>
            </div>
            <button onClick={handleCheckPeer}>Check Peer</button>
            {result && <p>{result}</p>}
        </div>
    );
};

export default CheckPeer;

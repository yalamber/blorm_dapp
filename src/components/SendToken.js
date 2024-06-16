import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import ABI from './ABI.json';
const CONTRACT_ABI = ABI.abi;

const SendTokens = () => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [destAddress, setDestAddress] = useState('');
    const [sourceAddress, setSourceAddress] = useState('');
    const [quote, setQuote] = useState(null);

    useEffect(() => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);
            window.ethereum.enable().catch(error => {
                console.error("User denied account access");
            });
        } else {
            console.error("Ethereum provider not found");
        }
    }, []);

    useEffect(() => {
        if (web3 && sourceAddress) {
            const contractInstance = new web3.eth.Contract(CONTRACT_ABI, sourceAddress);
            setContract(contractInstance);
            console.log("Contract initialized:", contractInstance);
        }
    }, [web3, sourceAddress]);

    const getQuote = async () => {
        if (!contract) {
            console.error("Contract is not initialized");
            return;
        }
    
        if (!destAddress || !web3.utils.isAddress(destAddress)) {
            console.error("Invalid destination address");
            return;
        }
    
        const recipientAddressBytes32 = web3.utils.padLeft(web3.utils.toHex(destAddress), 64);
        const dstEid = 40245;  // Destination endpoint ID
        const amountLD = web3.utils.toWei("0.05", "ether");  // Amount in local decimals
        const minAmountLD = web3.utils.toWei("0.01", "ether");  // Minimum amount in local decimals
        const extraOptions = "0x0003010011010000000000000000000000000000c350";  // Example placeholder, ensure correct format
        const composeMsg = web3.utils.hexToBytes("0x");  // Example placeholder, ensure correct format
        const oftCmd = web3.utils.hexToBytes("0x");  // Example placeholder, ensure correct format
    
        const sendParam = {
            dstEid: dstEid,
            to: recipientAddressBytes32,
            amountLD: amountLD,
            minAmountLD: minAmountLD,
            extraOptions: extraOptions,
            composeMsg: composeMsg,
            oftCmd: oftCmd
        };
    
        // Log parameters for debugging
        console.log("sendParam:", sendParam);
    
        try {
            const feeEstimate = await contract.methods.quoteSend(sendParam, false).call();
            setQuote(feeEstimate);
            console.log("Fee estimate:", feeEstimate);
        } catch (error) {
            console.error("Error getting quote:", error);
        }
    };
    

    return (
        <div>
            <h2>Send Tokens</h2>
            <div>
                <label>Source Address (Contract): </label>
                <input
                    type="text"
                    value={sourceAddress}
                    onChange={(e) => setSourceAddress(e.target.value)}
                />
            </div>
            <div>
                <label>Destination Address (Wallet): </label>
                <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                />
            </div>
            <button onClick={getQuote}>Get Quote</button>
            {quote && (
                <div>
                    <p>Estimated Fee:</p>
                    <p>Native Fee: {web3.utils.fromWei(quote.nativeFee, 'ether')} ETH</p>
                    <p>LayerZero Token Fee: {web3.utils.fromWei(quote.lzTokenFee, 'ether')} LZ</p>
                </div>
            )}
        </div>
    );
};

export default SendTokens;

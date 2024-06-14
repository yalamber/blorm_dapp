import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ABI from './ABI.json';
import { Web3 } from "web3";
const CONTRACT_ABI = ABI.abi;

const SendTokens = () => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [destAddress, setDestAddress] = useState('');
    const [sourceAddress, setSourceAddress] = useState('');

    let web3 = new Web3(Web3.givenProvider);

    useEffect(() => {
        const initializeEthers = async () => {
            if (window.ethereum) {
                const ethersProvider = new ethers.BrowserProvider(window.ethereum);
                const ethersSigner = await ethersProvider.getSigner();

                setProvider(ethersProvider);
                setSigner(ethersSigner);
            } else {
                console.error("Ethereum provider not found");
            }
        };

        initializeEthers();
    }, []);

    useEffect(() => {
        if (signer && sourceAddress) {
            const ethersContract = new ethers.Contract(sourceAddress, CONTRACT_ABI, signer);
            setContract(ethersContract);
            console.log("Contract initialized:", ethersContract);
        }
    }, [signer, sourceAddress]);

    const sendTokens = async () => {
        if (!contract) {
            console.error("Contract is not initialized");
            return;
        }

        const fee = {
            nativeFee: ethers.parseUnits("0.01", 18), // Replace with actual native fee
            lzTokenFee: ethers.parseUnits("0.01", 18) // Replace with actual LayerZero token fee
        };

        const recipientAddress = destAddress;

        // Convert the address to bytes32
        const recipientAddressBytes32 = ethers.zeroPadValue(recipientAddress, 32);
        // const recipientAddressBytes32 = web3.utils.padLeft(recipientAddress, 32, 0);
        console.log(ethers.isAddress(recipientAddressBytes32));
        console.log("Recipient address in bytes32:", recipientAddressBytes32);

        const sendParam = {
            dstEid: 40245, // Replace with actual destination endpoint ID
            to: recipientAddressBytes32, // Replace with actual recipient address
            amountToSendLD: ethers.parseEther("0.05"), // Replace with actual amount
            minAmountToCreditLD: ethers.parseEther("0.01"), // Replace with actual minimum amount
            extraOptions: new Uint8Array(0),
            composeMsg: new Uint8Array(0),
            oftCmd: new Uint8Array(0)
        };

        console.log('Sending transaction with params:', sendParam);

        try {
            const tx = await contract.quoteSend(
                sendParam,
                "0x", // Assuming no extra options, replace if necessary
                false, // Assuming you are paying in LZ token
                "0x", // Assuming no composed message, replace if necessary
                "0x",
            );
            console.log("Transaction sent:", tx);
            const receipt = await tx.wait();
            console.log("Transaction receipt:", receipt);
        } catch (error) {
            console.error("Error sending transaction:", error);
        }
    };

    return (
        <div>
            <h2>Send Tokens</h2>
            <div>
                <label>Source Address: </label>
                <input
                    type="text"
                    value={sourceAddress}
                    onChange={(e) => setSourceAddress(e.target.value)}
                />
            </div>
            <div>
                <label>Destination Address: </label>
                <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                />
            </div>
            <button onClick={sendTokens}>Send</button>
        </div>
    );
};

export default SendTokens;

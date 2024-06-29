import { ethers } from 'ethers';
import Blop from './Blop7.json';
import UploadToIPFS from './UploadToIPFS';
const chainListUrl = 'https://chainid.network/chains.json';

const fetchChainData = async () => {
    try {
        const response = await fetch(chainListUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching chain data:', error);
        throw error;
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getLastTokenId = async (contract, address) => {
    const tokens = await contract.getTokensOfOwner(address);
    return tokens.length > 0 ? tokens[tokens.length - 1] : null;
};

export const mintToken = async (metadata, selectedChain) => {
    const chainData = await fetchChainData();
    const chainInfo = chainData.find(chain => chain.chainId === selectedChain.chainID);
    if (!chainInfo) {
        throw new Error(`Chain with ID ${selectedChain.chainID} not found`);
    }

    const contractAddress = selectedChain.contractAddress;
    const chainParams = {
        chainId: ethers.toQuantity(chainInfo.chainId),
        chainName: chainInfo.name,
        nativeCurrency: chainInfo.nativeCurrency,
        rpcUrls: chainInfo.rpc,
        blockExplorerUrls: chainInfo.explorers.map(explorer => explorer.url),
    };

    try {
        if (!window.ethereum) {
            throw new Error("Metamask is not installed");
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainParams.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [chainParams],
                    });
                } catch (addError) {
                    throw new Error("Failed to add the chain to MetaMask");
                }
            } else {
                throw new Error("Failed to switch to the specified chain");
            }
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const recipientAddress = await signer.getAddress();
        const contract = new ethers.Contract(contractAddress, Blop.abi, signer);

        if (!ethers.isAddress(recipientAddress)) {
            throw new Error("Invalid recipient address");
        }

        const metadataURI = await UploadToIPFS(JSON.stringify(metadata), true);
        console.log('Metadata URI:', metadataURI);

        const mintFee = ethers.parseUnits("0.001", "ether");
        
        const gasEstimate = await contract.mint.estimateGas(recipientAddress, metadataURI, {
            value: mintFee,
        });

        const gasPrice = (await provider.getFeeData()).gasPrice;

        const transaction = await contract.mint(recipientAddress, metadataURI, {
            value: mintFee,
        });
        const receipt = await transaction.wait();

        console.log('Transaction receipt:', receipt);

        const txHash = receipt.transactionHash;

        const iface = new ethers.Interface(Blop.abi);

        const tokenMintedEvent = receipt.logs.map(log => {
            try {
                return iface.parseLog(log);
            } catch (e) {
                console.log('Log parsing error:', e);
                return null;
            }
        }).find(event => event && event.name === 'TokenMinted');

        if (tokenMintedEvent) {
            console.log('Token minted event:', tokenMintedEvent.args.tokenId.toString());
            return [tokenMintedEvent.args.tokenId, txHash];
        } else {
            console.error('TokenMinted event not found in logs:', receipt.logs);
            console.log('Attempting to fetch latest minted token ID from contract');

            await delay(5000);

            const latestTokenId = await getLastTokenId(contract, recipientAddress);
            if (latestTokenId) {
                console.log('Latest minted token ID:', latestTokenId.toString());
                return [latestTokenId, txHash];
            } else {
                throw new Error('Unable to retrieve the latest minted token ID');
            }
        }
    } catch (error) {
        console.error('Error minting token:', error);
        throw error;
    }
};

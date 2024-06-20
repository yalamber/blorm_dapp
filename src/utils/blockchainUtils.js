import { ethers } from 'ethers';
import Blop from './BlopABI.json';
import UploadToIPFS from '../components/UploadToIPFS';

const contractAddress = '0x323f3D06f9c1aC17c0F504FBA1dd598fAdD28ea2'; // Replace with your contract address

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mintToken = async (metadata) => {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const recipientAddress = await signer.getAddress();
        const contract = new ethers.Contract(contractAddress, Blop.abi, signer);

        // Upload metadata to IPFS and get the URI
        const metadataURI = await UploadToIPFS(JSON.stringify(metadata), true);

        // Mint the token to the recipient address and set the token URI in one transaction
        const transaction = await contract.mintAndSetTokenURI(recipientAddress, metadataURI);
        const receipt = await transaction.wait();

        console.log('Transaction receipt:', receipt);

        // ABI Interface to decode the logs
        const iface = new ethers.Interface(Blop.abi);

        // Manually decode the logs
        const tokenMintedEvent = receipt.logs.map(log => {
            try {
                return iface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).find(event => event && event.name === 'TokenMinted');

        if (tokenMintedEvent) {
            console.log('Token minted event:', tokenMintedEvent.args.tokenId.toString());
            return tokenMintedEvent.args.tokenId;
        } else {
            console.error('TokenMinted event not found in logs:', receipt.logs);
            console.log('Attempting to fetch latest minted token ID from contract');

            // Wait for a while before attempting to fetch the latest minted token ID
            await delay(5000); // Adjust the delay time as needed

            // Fetch the latest minted token ID
            const latestTokenId = await contract.latestTokenMinted(recipientAddress);
            if (latestTokenId) {
                console.log('Latest minted token ID:', latestTokenId.toString());
                return latestTokenId;
            } else {
                throw new Error('Unable to retrieve the latest minted token ID');
            }
        }
    } catch (error) {
        console.error('Error minting token:', error);
        throw error; // Re-throw the error to handle it outside of this function if needed
    }
};

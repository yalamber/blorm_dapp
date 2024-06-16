import { ethers } from 'ethers';
import Blop from './BlopABI.json';
import UploadToIPFS from '../components/UploadToIPFS';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contractAddress = '0x0A52E83AE87406bC5171e5fc1e057996e43b274C'; // Replace with your contract address
const contract = new ethers.Contract(contractAddress, Blop.abi, signer);

export const mintToken = async (metadata, recipientAddress) => {
    try {
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

        if (!tokenMintedEvent) {
            console.error('TokenMinted event not found in logs:', receipt.logs);
            throw new Error('TokenMinted event not found');
        }

        console.log('Token minted event:', tokenMintedEvent.args.tokenId.toString());
        return tokenMintedEvent.args.tokenId;
    } catch (error) {
        console.error('Error minting token:', error);
    }
};

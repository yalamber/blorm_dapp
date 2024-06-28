const { ethers } = require("hardhat");
const blop6 = require("../src/utils/Blop6.json"); // Update the path to your ABI file
const abi = blop6.abi;
const { Options } = require("@layerzerolabs/lz-v2-utilities");

/** @type import('hardhat/config').HardhatUserConfig */
// Ensure your configuration variables are set before executing the script
const { vars } = require("hardhat/config");

// Go to https://infura.io, sign up, create a new API key
// in its dashboard, and add it to the configuration variables
const INFURA_API_KEY = vars.get("INFURA_API_KEY");

describe("Interaction with Blop6 Contract", function () {
  it("should send token successfully", async function () {
    const eid = '';
    const peer = '';
    const tokenId = '100';
    const dstEid = '40245';
    const contractAddress = '0x7d3500d69c8589fbf271168BBb48CF0d6B97820B';
    const userAddress = '0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B';
    const destAddress = '0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B';

    try {
      const provider = ethers.provider;

      // Create a wallet/signer with a private key
      const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Replace with your private key
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

      const contractABI = abi;
      const contract = new ethers.Contract(contractAddress, contractABI, wallet);

      const GAS_LIMIT = BigInt(60000000); // Gas limit for the executor
      const MSG_VALUE = BigInt(0); // msg.value for the lzReceive() function on destination in wei

      const _options = Options.newOptions().addExecutorLzReceiveOption(GAS_LIMIT, MSG_VALUE);

      const tokenURI = await contract.tokenURI(BigInt(tokenId));

      console.log('tokenURI:', tokenURI);

      const destinationAddressFormatted = ethers.zeroPadValue(destAddress, 32); // ethers.toBeHex(
      const extraOptionsFormatted = _options.toBytes();

      const sendParams = {
        dstEid: parseInt(dstEid),
        to: destinationAddressFormatted,
        tokenID: parseInt(tokenId),
        tokenURI: tokenURI,
        extraOptions: extraOptionsFormatted
      };

      const MessagingFee = {
        nativeFee: 1,
        lzTokenFee: 1,
      };

      const overrides = {
        gasLimit: 8000000, // Adjust the gas limit as needed
        gasPrice: ethers.parseUnits("20", "gwei"), // Adjust the gas price as needed
      };

      console.log('sending with:', sendParams, MessagingFee, userAddress);

      const tx = await contract.send(sendParams, MessagingFee, userAddress, overrides);
      await tx.wait();

      console.log('tx:', tx);

    } catch (error) {
      console.error("Transaction failed:", error);
    }

  });
});

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const contractAddress = "0x00A76DaE1B17948FE91F37c06B4c81AD084383CB";

    const ERC721PresetMinterPauserAutoId = await ethers.getContractFactory("ERC721PresetMinterPauserAutoId");
    const erc721 = await ERC721PresetMinterPauserAutoId.attach(contractAddress);

    console.log("Interacting with contract at:", contractAddress);

    // Mint a new token
    const tx = await erc721.mint(deployer.address);
    await tx.wait();
    console.log("Minted new token to:", deployer.address);
    /*
    // Pause the contract
    const pauseTx = await erc721.pause();
    await pauseTx.wait();
    console.log("Contract paused");

    // Unpause the contract
    const unpauseTx = await erc721.unpause();
    await unpauseTx.wait();
    console.log("Contract unpaused");
    */
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

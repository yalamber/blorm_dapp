const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenOApp", (m) => {

    // Constants
    const lzEndpoint = "0x6EDCE65403992e310A62460808c4b910D972f10f"; // "0x6EDCE65403992e310A62460808c4b910D972f10f"; // Replace with actual endpoint address
    const owner = "0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B"; // Replace with actual owner address
    const initialSupply = ethers.parseUnits("1000000", 18); // 1 million tokens with 18 decimals

    // Deploy the MyOFT contract
    const TokenOApp = m.contract("TokenOApp", [
        "BLORM", // Token name
        "BLORM", // Token symbol
        lzEndpoint,
        owner,
        initialSupply,
        0
    ]);

    return { TokenOApp };
});
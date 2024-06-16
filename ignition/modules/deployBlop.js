const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployContracts", (m) => {
    
    // Deploy the ERC721PresetMinterPauserAutoId contract
    const ERC721PresetMinterPauserAutoId = m.contract("Blop", [
        "BLOP",             // Name of the token
        "BLOP",              // Symbol of the token
        ""  // Base token URI
    ]);

    return { ERC721PresetMinterPauserAutoId };
});

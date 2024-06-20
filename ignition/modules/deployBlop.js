const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployContracts", (m) => {
    
    // Deploy the ONFT721 contract
    const ONFT721 = m.contract("ONFT721", [
        "BLOP",             // Name of the token
        "BLOP",             // Symbol of the token
        100000,             // Minimum gas to transfer
        "0x6EDCE65403992e310A62460808c4b910D972f10f" // LayerZero endpoint address
    ]);

    // Deploy the Blop contract
    const Blop = m.contract("Blop", [
        ONFT721.address,    // Address of the ONFT721 contract
        ""                  // Base token URI
    ]);

    return { Blop };
});

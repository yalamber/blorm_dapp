const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployContracts", (m) => {

    // Deploy the SendString contract

    const StringOApp = m.contract("StringOApp", [

        "0x6EDCE65403992e310A62460808c4b910D972f10f", // Replace with actual endpoint address

        "0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B"     // Replace with actual owner address

    ]);


    /*
      // Deploy the SendToken contract
    
      const sendToken = m.contract("TokenOApp", [
    
        "0xYourEndpointAddress", // Replace with actual endpoint address
    
        "0x0c778e66efa266b5011c552C4A7BDA63Ad24C37B",    // Replace with actual owner address
    
        "0xYourTokenAddress"     // Replace with actual token address
    
      ]);
    
    
    */

    return { StringOApp }; //TokenOApp

});
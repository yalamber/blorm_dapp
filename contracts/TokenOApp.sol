// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract TokenOApp is OFT {
    uint256 public mintingFee;

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        uint256 _initialSupply,
        uint256 _mintingFee
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable() {
        _mint(_delegate, _initialSupply);
        mintingFee = _mintingFee;
    }

    function mint(address _to, uint256 _amount) external payable {
        require(msg.value >= mintingFee, "Insufficient minting fee");
        _mint(_to, _amount);
    }

    function setMintingFee(uint256 _newFee) external onlyOwner {
        mintingFee = _newFee;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { IOAppMsgInspector } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppMsgInspector.sol";
import { OAppPreCrimeSimulator } from "@layerzerolabs/lz-evm-oapp-v2/contracts/precrime/OAppPreCrimeSimulator.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { ERC721Enumerable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import { OFTComposeMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
import { MessagingReceipt, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


/**
 * @dev Struct representing OFT limit information.
 * @dev These amounts can change dynamically and are up the the specific oft implementation.
 */
struct OFTLimit {
    uint256 tokenID;
}

/**
 * @dev Struct representing OFT receipt information.
 */
struct OFTReceipt {
    uint256 tokenID;
}

/** 
 * @dev Struct representing OFT fee details.
 * @dev Future proof mechanism to provide a standardized way to communicate fees to things like a UI.
 */
struct OFTFeeDetail {
    int256 feeAmountLD; // Amount of the fee in local decimals.
    string description; // Description of the fee.
}

struct MessagingParams {
    uint32 dstEid;
    bytes32 receiver;
    bytes message;
    bytes options;
    bool payInLzToken;
}


/**
 * @dev Struct representing token parameters for the OFT send() operation.
 */
struct SendParam {
    uint32 dstEid; // Destination endpoint ID.
    bytes32 to; // Recipient address.
    uint32 tokenID; // Token ID to transfer..
    string tokenURI; // Token URI.
    bytes extraOptions;
}


contract Blop7 is OApp, ERC721, ERC721URIStorage, ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;
    uint256 private mintRate;

    event TokenMinted(address recipient, uint256 tokenId);

    event testAction(string action);

    event OFTSent(
        bytes32 indexed guid,
        uint32 dstEid,
        address indexed fromAddress,
        uint256 tokenID
    );
    event OFTReceived(
        bytes32 indexed guid,
        uint32 srcEid,
        address indexed toAddress,
        uint256 tokenID
    );

    constructor(
        address _endpoint, 
        address _owner, 
        string memory _name, 
        string memory _symbol, 
        uint256 _initialMintRate, 
        string memory baseTokenURI,
        uint256 _tokenIDStart
    ) OApp(_endpoint, _owner) ERC721(_name, _symbol) Ownable(_owner) {
        _baseTokenURI = baseTokenURI;
        mintRate = _initialMintRate;
        _tokenIdTracker._value = _tokenIDStart;
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata payload,
        address,
        bytes calldata
    ) internal override {
        SendParam memory inFlightToken = abi.decode(payload, (SendParam));
        if (!_credit(bytes32ToAddress(inFlightToken.to), inFlightToken.tokenID, inFlightToken.tokenURI)) {
            revert("Failed to mint token on destination chain");
        }
    }

    function isPeer(uint32 _eid, bytes32 _peer) public view virtual returns (bool) {
        return peers[_eid] == _peer;
    }

    function _debit(
        address _from,
        uint256 _tokenID,
        uint32 _dstEid
    ) internal virtual returns (bool success) {
        if (ownerOf(_tokenID) != _from) {
            revert("Transfer of token that is not own");
        }
        _burn(_tokenID);
        return true;
    }

    function _credit(
        address _to,
        uint256 _tokenID,
        string memory _tokenURI
    ) internal virtual returns (bool success) {
        _mint(_to, _tokenID);
        _setTokenURI(_tokenID, _tokenURI);
        return true;
    }

    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable virtual returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) {
        if (!_debit(msg.sender, _sendParam.tokenID, _sendParam.dstEid)) {
            revert("Transfer of token that is not own or failed to burn token.");
        }
        (bytes memory message, bytes memory options) = _buildMsgAndOptions(_sendParam);
        require(message.length > 0, "Failed to build message.");

        msgReceipt = _lzSend(_sendParam.dstEid, message, options, _fee, _refundAddress);
        require(msgReceipt.guid != bytes32(0), "Failed to send message to LayerZero endpoint.");

        oftReceipt = OFTReceipt(_sendParam.tokenID);
        emit OFTSent(msgReceipt.guid, _sendParam.dstEid, msg.sender, _sendParam.tokenID);
    }

    function quote(
        uint32 _dstEid,
        SendParam memory _message,
        bytes calldata _options,
        bool _payInLzToken
    ) public view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory _payload = abi.encode(_message);
        MessagingFee memory fee = _quote(_dstEid, _payload, _options, _payInLzToken);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    function encode(
        bytes32 _sendTo,
        uint64 _tokenID,
        string memory _tokenURI
    ) internal view returns (bytes memory _msg) {
        _msg = abi.encodePacked(_sendTo, _tokenID, _tokenURI);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    function bytes32ToAddress(bytes32 _b) internal pure returns (address) {
        return address(uint160(uint256(_b)));
    }

    function _buildMsgAndOptions(
        SendParam calldata _sendParam
    ) internal view virtual returns (bytes memory message, bytes memory options) {
        bool hasCompose;
        message = encode(
            _sendParam.to,
            _sendParam.tokenID,
            _sendParam.tokenURI
        );
        options = _sendParam.extraOptions;
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(address recipient, string memory metadataURI) public virtual payable {
        require(msg.value >= mintRate, "Insufficient mint fee");
        uint256 tokenId = _tokenIdTracker.current();
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _tokenIdTracker.increment();
        emit TokenMinted(recipient, tokenId);
    }

    function setRate(uint256 _mintRate) external onlyOwner {
        mintRate = _mintRate;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");
        payable(owner()).transfer(amount);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _increaseBalance(address account, uint128 value) internal virtual override(ERC721, ERC721Enumerable) {
        ERC721Enumerable._increaseBalance(account, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return ERC721Enumerable._update(to, tokenId, auth);
    }

    function getTokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }
}
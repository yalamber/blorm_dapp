// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { IOAppMsgInspector } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppMsgInspector.sol";
import { OAppPreCrimeSimulator } from "@layerzerolabs/lz-evm-oapp-v2/contracts/precrime/OAppPreCrimeSimulator.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
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
    bytes extraOptions; // Additional options supplied by the caller to be used in the LayerZero message.
    bytes composeMsg; // The composed message for the send() operation.
    bytes oftCmd; // The OFT command to be executed, unused in default OFT implementations.
}

contract Blop6 is OApp, ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;

    string private _baseTokenURI;
    uint256 private mintRate;

    event TokenMinted(address recipient, uint256 tokenId);

    // Events
    event OFTSent(
        bytes32 indexed guid, // GUID of the OFT message.
        uint32 dstEid, // Destination Endpoint ID.
        address indexed fromAddress, // Address of the sender on the src chain.
        uint256 tokenID
    );
    event OFTReceived(
    bytes32 indexed guid, // GUID of the OFT message.
    uint32 srcEid, // Source Endpoint ID.
    address indexed toAddress, // Address of the recipient on the dst chain.
    uint256 tokenID
    );

    // Some arbitrary data you want to deliver to the destination chain!
    struct transferToken {
        address owner;
        uint256 tokenID;
        string tokenURI;
    }

    transferToken public inFlightToken;


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


    /**
     * @notice Sends a message from the source to destination chain.
     * @param _dstEid Destination chain's endpoint ID.
     * @param _message The message to send.
     * @param _options Message execution options (e.g., for sending gas to destination).
     */
    function send(
        uint32 _dstEid,
        transferToken memory _message,
        bytes calldata _options
    ) external payable {
        // Encodes the message before invoking _lzSend.
        bytes memory _payload = abi.encode(_message);
        _lzSend(
            _dstEid,
            _payload,
            _options,
            // Fee in native gas and ZRO token.
            MessagingFee(msg.value, 0),
            // Refund address in case of failed source message.
            payable(msg.sender)
        );
    }

    /**
     * @dev Called when data is received from the protocol. It overrides the equivalent function in the parent contract.
     * Protocol messages are defined as packets, comprised of the following parameters.
     * @param _origin A struct containing information about where the packet came from.
     * @param _guid A global unique identifier for tracking the packet.
     * @param payload Encoded message.
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata payload,
        address,  // Executor address as specified by the OApp.
        bytes calldata  // Any extra data or options to trigger on receipt.
    ) internal override {
        // Decode the payload to get the message
        // In this case, type is string, but depends on your encoding!
        inFlightToken = abi.decode(payload, (transferToken));
        bool creditSuccess = _credit(inFlightToken.owner, inFlightToken.tokenID, inFlightToken.tokenURI);
        if (!creditSuccess) {
            revert("Failed to mint token on destination chain");
        }
    }

    /**
     * @dev Check if the peer is considered 'trusted' by the OApp.
     * @param _eid The endpoint ID to check.
     * @param _peer The peer to check.
     * @return Whether the peer passed is considered 'trusted' by the OApp.
     *
     * @dev Enables OAppPreCrimeSimulator to check whether a potential Inbound Packet is from a trusted source.
     */
    function isPeer(uint32 _eid, bytes32 _peer) public view virtual returns (bool) {
        return peers[_eid] == _peer;
    }

    function _debit(
        address _from,
        uint256 _tokenID,
        uint32 _dstEid
    ) internal virtual returns (bool success) {
        // @dev Burn the token on the source chain.
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
        // @dev Mint the token on the destination chain.
        _mint(_to, _tokenID);
        _setTokenURI(_tokenID, _tokenURI);
        return true;
    }

    /**
     * @dev Executes the send operation.
     * @param _sendParam The parameters for the send operation.
     * @param _fee The calculated fee for the send() operation.
     *      - nativeFee: The native fee.
     *      - lzTokenFee: The lzToken fee.
     * @param _refundAddress The address to receive any excess funds.
     * @return msgReceipt The receipt for the send operation.
     * @return oftReceipt The OFT receipt information.
     *
     * @dev MessagingReceipt: LayerZero msg receipt
     *  - guid: The unique identifier for the sent message.
     *  - nonce: The nonce of the sent message.
     *  - fee: The LayerZero fee incurred for the message.
     */
    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable virtual returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt) {
        // @dev Applies the token transfers regarding this send() operation.
        // - amountSentLD is the amount in local decimals that was ACTUALLY sent/debited from the sender.
        // - amountReceivedLD is the amount in local decimals that will be received/credited to the recipient on the remote OFT instance.
        bool debitSuccess = _debit(
            msg.sender,
            _sendParam.tokenID,
            _sendParam.dstEid
        );

        if (!debitSuccess) {
            revert("Transfer of token that is not own or failed to burn token.");
        }

        // @dev Builds the options and OFT message to quote in the endpoint.
        (bytes memory message, bytes memory options) = _buildMsgAndOptions(_sendParam);

        // @dev Sends the message to the LayerZero endpoint and returns the LayerZero msg receipt.
        msgReceipt = _lzSend(_sendParam.dstEid, message, options, _fee, _refundAddress);
        // @dev Formulate the OFT receipt.
        oftReceipt = OFTReceipt(_sendParam.tokenID);

        emit OFTSent(msgReceipt.guid, _sendParam.dstEid, msg.sender, _sendParam.tokenID);
    }


    /**
     * @dev Encodes an OFT LayerZero message.
     * @param _sendTo The recipient address.
     * @param _tokenID The token ID.
     * @param _tokenURI The token URI.
     * @param _composeMsg The composed message.
     * @return _msg The encoded message.
     * @return hasCompose A boolean indicating whether the message has a composed payload.
     */
    function encode(
        bytes32 _sendTo,
        uint64 _tokenID,
        string memory _tokenURI,
        bytes memory _composeMsg
    ) internal view returns (bytes memory _msg, bool hasCompose) {
        hasCompose = _composeMsg.length > 0;
        // @dev Remote chains will want to know the composed function caller ie. msg.sender on the src.
        _msg = hasCompose
            ? abi.encodePacked(_sendTo, _tokenID, _tokenURI, addressToBytes32(msg.sender), _composeMsg)
            : abi.encodePacked(_sendTo, _tokenID, _tokenURI);
    }


    /**
     * @dev Converts an address to bytes32.
     * @param _addr The address to convert.
     * @return The bytes32 representation of the address.
     */
    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }

    /**
     * @dev Converts bytes32 to an address.
     * @param _b The bytes32 value to convert.
     * @return The address representation of bytes32.
     */
    function bytes32ToAddress(bytes32 _b) internal pure returns (address) {
        return address(uint160(uint256(_b)));
    }


    /**
     * @dev Internal function to build the message and options.
     * @param _sendParam The parameters for the send() operation.
     * @return message The encoded message.
     * @return options The encoded options.
     */
    function _buildMsgAndOptions(
        SendParam calldata _sendParam
    ) internal view virtual returns (bytes memory message, bytes memory options) {
        bool hasCompose;
        // @dev This generated message has the msg.sender encoded into the payload so the remote knows who the caller is.
        (message, hasCompose) = encode(
            _sendParam.to,
            _sendParam.tokenID,
            _sendParam.tokenURI,
            // @dev Must be include a non empty bytes if you want to compose, EVEN if you dont need it on the remote.
            _sendParam.composeMsg
        );
        // @dev Change the msg type depending if its composed or not.
        // uint16 msgType = hasCompose ? SEND_AND_CALL : SEND;
        // @dev Combine the callers _extraOptions with the enforced options via the OAppOptionsType3.
        options = _sendParam.extraOptions; // combineOptions(_sendParam.dstEid, msgType, _sendParam.extraOptions);

        // @dev Optionally inspect the message and options depending if the OApp owner has set a msg inspector.
        // @dev If it fails inspection, needs to revert in the implementation. ie. does not rely on return boolean
        // if (msgInspector != address(0)) IOAppMsgInspector(msgInspector).inspect(message, options);
    }



    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Returns the base URI set for the tokens.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Public mint function to mint new tokens with metadata.
     * @param recipient The address to mint the token to.
     * @param metadataURI The metadata URI to associate with the token.
     */
    function mint(address recipient, string memory metadataURI) public virtual payable {
        require(msg.value >= mintRate, "Insufficient mint fee");
        uint256 tokenId = _tokenIdTracker.current();
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        _tokenIdTracker.increment();
        emit TokenMinted(recipient, tokenId);
    }

    /**
     * @dev Sets the mint rate for new tokens.
     * @param _mintRate The new mint rate.
     */
    function setRate(uint256 _mintRate) external onlyOwner {
        mintRate = _mintRate;
    }

    /**
     * @dev Withdraws the balance of the contract to the owner's address.
     */
    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "No funds to withdraw");
        payable(owner()).transfer(amount);
    }

    /**
     * @dev See {ERC721-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

}
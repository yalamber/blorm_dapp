// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract Blop2 is ERC721, ERC721URIStorage, Ownable, AccessControlEnumerable, ReentrancyGuard, IERC721Receiver {
    using Counters for Counters.Counter;

    event TokenMinted(address recipient, uint256 tokenId);
    event MessageFailed(uint16 _srcChainId, bytes _srcAddress, uint64 _nonce, bytes _payload, bytes _reason);
    event RetryMessageSuccess(uint16 _srcChainId, bytes _srcAddress, uint64 _nonce, bytes32 _payloadHash);

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    Counters.Counter private _tokenIdTracker;
    mapping(uint256 => bool) private _tokenURISet;
    mapping(uint16 => mapping(bytes => mapping(uint64 => bytes32))) public failedMessages;
    mapping(uint16 => bytes) public trustedRemoteLookup;
    mapping(uint16 => mapping(uint16 => uint)) public minDstGasLookup;
    mapping(uint16 => uint) public payloadSizeLimitLookup;
    address public precrime;

    uint public minGasToTransferAndStore;
    mapping(uint16 => uint) public dstChainIdToBatchLimit;
    mapping(uint16 => uint) public dstChainIdToTransferGas;
    mapping(bytes32 => StoredCredit) public storedCredits;

    string private _baseTokenURI;

    struct StoredCredit {
        uint16 srcChainId;
        address toAddress;
        uint index;
        bool creditsRemain;
    }

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(address to) public virtual onlyOwner {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(to, tokenId);
        emit TokenMinted(to, tokenId);
        _tokenIdTracker.increment();
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public virtual onlyOwner {
        require(!_tokenURISet[tokenId], "Blop: token URI can only be set once");
        _setTokenURI(tokenId, _tokenURI);
        _tokenURISet[tokenId] = true;
    }

    function mintAndSetTokenURI(address recipient, string memory metadataURI) public virtual onlyOwner {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit TokenMinted(recipient, tokenId);
        _tokenIdTracker.increment();
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerable, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Functions for Non-blocking Layer Zero (with dummy implementations)
    function _blockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual {
        // Implement actual LayerZero blocking receive logic here
    }

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal virtual {
        // Implement actual LayerZero non-blocking receive logic here
    }

    function retryMessage(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) public payable virtual {
        bytes32 payloadHash = failedMessages[_srcChainId][_srcAddress][_nonce];
        require(payloadHash != bytes32(0), "NonblockingLzApp: no stored message");
        require(keccak256(_payload) == payloadHash, "NonblockingLzApp: invalid payload");
        failedMessages[_srcChainId][_srcAddress][_nonce] = bytes32(0);
        _nonblockingLzReceive(_srcChainId, _srcAddress, _nonce, _payload);
        emit RetryMessageSuccess(_srcChainId, _srcAddress, _nonce, payloadHash);
    }

    function _storeFailedMessage(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload,
        bytes memory _reason
    ) internal virtual {
        failedMessages[_srcChainId][_srcAddress][_nonce] = keccak256(_payload);
        emit MessageFailed(_srcChainId, _srcAddress, _nonce, _payload, _reason);
    }

    // Functions to interact with Layer Zero (with dummy implementations)
    function setTrustedRemote(uint16 _remoteChainId, bytes calldata _path) external onlyOwner {
        trustedRemoteLookup[_remoteChainId] = _path;
        emit SetTrustedRemote(_remoteChainId, _path);
    }

    function setMinGasToTransferAndStore(uint _minGasToTransferAndStore) external onlyOwner {
        require(_minGasToTransferAndStore > 0, "minGasToTransferAndStore must be > 0");
        minGasToTransferAndStore = _minGasToTransferAndStore;
        emit SetMinGasToTransferAndStore(_minGasToTransferAndStore);
    }

    function setDstChainIdToTransferGas(uint16 _dstChainId, uint _dstChainIdToTransferGas) external onlyOwner {
        require(_dstChainIdToTransferGas > 0, "dstChainIdToTransferGas must be > 0");
        dstChainIdToTransferGas[_dstChainId] = _dstChainIdToTransferGas;
        emit SetDstChainIdToTransferGas(_dstChainId, _dstChainIdToTransferGas);
    }

    function setDstChainIdToBatchLimit(uint16 _dstChainId, uint _dstChainIdToBatchLimit) external onlyOwner {
        require(_dstChainIdToBatchLimit > 0, "dstChainIdToBatchLimit must be > 0");
        dstChainIdToBatchLimit[_dstChainId] = _dstChainIdToBatchLimit;
        emit SetDstChainIdToBatchLimit(_dstChainId, _dstChainIdToBatchLimit);
    }

    function _creditTo(uint16, address _toAddress, uint _tokenId) internal virtual {
        if (!_exists(_tokenId)) {
            _safeMint(_toAddress, _tokenId);
        } else {
            _transfer(address(this), _toAddress, _tokenId);
        }
    }

    function _debitFrom(address _from, uint16, bytes memory, uint _tokenId) internal virtual {
        require(_isApprovedOrOwner(_msgSender(), _tokenId), "Blop: send caller is not owner nor approved");
        require(ownerOf(_tokenId) == _from, "Blop: send from incorrect owner");
        _transfer(_from, address(this), _tokenId);
    }

    function _checkGasLimit(
        uint16,
        uint16,
        bytes memory,
        uint
    ) internal view virtual {
        // Implement gas limit check logic here
    }

    function _lzSend(
        uint16,
        bytes memory,
        address payable,
        address,
        bytes memory,
        uint
    ) internal virtual {
        // Implement LayerZero send logic here
    }

    function estimateSendFee(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint _tokenId,
        bool _useZro,
        bytes memory _adapterParams
    ) public view returns (uint nativeFee, uint zroFee) {
        // Implement fee estimation logic here
    }

    function estimateSendBatchFee(
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        bool _useZro,
        bytes memory _adapterParams
    ) public view returns (uint nativeFee, uint zroFee) {
        // Implement batch fee estimation logic here
    }

    function sendFrom(
        address _from,
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint _tokenId,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams
    ) public payable virtual {
        _send(_from, _dstChainId, _toAddress, _toSingletonArray(_tokenId), _refundAddress, _zroPaymentAddress, _adapterParams);
    }

    function sendBatchFrom(
        address _from,
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams
    ) public payable virtual {
        _send(_from, _dstChainId, _toAddress, _tokenIds, _refundAddress, _zroPaymentAddress, _adapterParams);
    }

    function _send(
        address _from,
        uint16 _dstChainId,
        bytes memory _toAddress,
        uint[] memory _tokenIds,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams
    ) internal virtual {
        require(_tokenIds.length > 0, "tokenIds[] is empty");
        require(_tokenIds.length == 1 || _tokenIds.length <= dstChainIdToBatchLimit[_dstChainId], "batch size exceeds dst batch limit");

        for (uint i = 0; i < _tokenIds.length; i++) {
            _debitFrom(_from, _dstChainId, _toAddress, _tokenIds[i]);
        }

        bytes memory payload = abi.encode(_toAddress, _tokenIds);

        _checkGasLimit(_dstChainId, 1, _adapterParams, dstChainIdToTransferGas[_dstChainId] * _tokenIds.length);
        _lzSend(_dstChainId, payload, _refundAddress, _zroPaymentAddress, _adapterParams, msg.value);
        emit SendToChain(_dstChainId, _from, _toAddress, _tokenIds);
    }

    function _creditTill(
        uint16 _srcChainId,
        address _toAddress,
        uint _startIndex,
        uint[] memory _tokenIds
    ) internal returns (uint) {
        uint i = _startIndex;
        while (i < _tokenIds.length) {
            if (gasleft() < minGasToTransferAndStore) break;

            _creditTo(_srcChainId, _toAddress, _tokenIds[i]);
            i++;
        }
        return i;
    }

    function clearCredits(bytes memory _payload) external virtual nonReentrant {
        bytes32 hashedPayload = keccak256(_payload);
        require(storedCredits[hashedPayload].creditsRemain, "no credits stored");

        (, uint[] memory tokenIds) = abi.decode(_payload, (bytes, uint[]));

        uint nextIndex = _creditTill(
            storedCredits[hashedPayload].srcChainId,
            storedCredits[hashedPayload].toAddress,
            storedCredits[hashedPayload].index,
            tokenIds
        );
        require(nextIndex > storedCredits[hashedPayload].index, "not enough gas to process credit transfer");

        if (nextIndex == tokenIds.length) {
            delete storedCredits[hashedPayload];
            emit CreditCleared(hashedPayload);
        } else {
            storedCredits[hashedPayload] = StoredCredit(
                storedCredits[hashedPayload].srcChainId,
                storedCredits[hashedPayload].toAddress,
                nextIndex,
                true
            );
        }
    }

    event SendToChain(uint16 indexed _dstChainId, address indexed _from, bytes indexed _toAddress, uint[] _tokenIds);
    event ReceiveFromChain(uint16 indexed _srcChainId, bytes indexed _srcAddress, address indexed _toAddress, uint[] _tokenIds);
    event CreditStored(bytes32 _hashedPayload, bytes _payload);
    event CreditCleared(bytes32 _hashedPayload);
    event SetTrustedRemote(uint16 _remoteChainId, bytes _path);
    event SetMinGasToTransferAndStore(uint _minGasToTransferAndStore);
    event SetDstChainIdToTransferGas(uint16 _dstChainId, uint _dstChainIdToTransferGas);
    event SetDstChainIdToBatchLimit(uint16 _dstChainId, uint _dstChainIdToBatchLimit);

    function _toSingletonArray(uint element) internal pure returns (uint[] memory) {
        uint[] memory array = new uint[](1);
        array[0] = element;
        return array;
    }

    function onERC721Received(address, address, uint, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
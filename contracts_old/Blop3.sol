// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/onft721/interfaces/IONFT721.sol";
import "@layerzerolabs/solidity-examples/contracts/token/onft721/ONFT721Core.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Blop3 is ONFT721Core, ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;
    string private _baseTokenURI;

    event TokenMinted(address recipient, uint256 tokenId);

    constructor(
        string memory _name,
        string memory _symbol,
        uint _minGasToTransferAndStore,
        address _lzEndpoint,
        string memory baseTokenURI,
        address initialOwner
    ) ERC721(_name, _symbol) ONFT721Core(_minGasToTransferAndStore, _lzEndpoint) Ownable(initialOwner) {
        _baseTokenURI = baseTokenURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function mint(address to) public virtual {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(to, tokenId);
        emit TokenMinted(to, tokenId);
        _tokenIdTracker.increment();
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(bytes(tokenURI(tokenId)).length == 0, "Token URI can only be set once");
        _setTokenURI(tokenId, _tokenURI);
    }

    function mintAndSetTokenURI(address recipient, string memory metadataURI) public {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit TokenMinted(recipient, tokenId);
        _tokenIdTracker.increment();
    }

    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return ownerOf(tokenId) != address(0);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ONFT721Core, ERC721, ERC721URIStorage) returns (bool) {
        return interfaceId == type(IONFT721).interfaceId || super.supportsInterface(interfaceId);
    }

    function _debitFrom(
        address _from,
        uint16, // _dstChainId is unused in this implementation
        bytes memory, // _toAddress is unused in this implementation
        uint _tokenId
    ) internal virtual override {
        require(_isAuthorized(_msgSender(), _msgSender(), _tokenId), "Send caller is not owner nor approved");
        require(ownerOf(_tokenId) == _from, "Send from incorrect owner");
        _transfer(_from, address(this), _tokenId);
    }

    function _creditTo(
        uint16, // _srcChainId is unused in this implementation
        address _toAddress,
        uint _tokenId
    ) internal virtual override {
        require(!_exists(_tokenId) || (ownerOf(_tokenId) == address(this)), "Token already exists and is not owned by this contract");
        if (!_exists(_tokenId)) {
            _safeMint(_toAddress, _tokenId);
        } else {
            _transfer(address(this), _toAddress, _tokenId);
        }
    }
    
}

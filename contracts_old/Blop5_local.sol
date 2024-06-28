// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import { OFTCore } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFTCore.sol";

/**
 * @title Blop5 ONFT721 Contract
 * @dev Extends ERC721, ERC721URIStorage, and OFTCore for cross-chain token transfers with LayerZero.
 */
contract Blop5 is OFTCore, ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdTracker;
    string private _baseTokenURI;
    uint256 private mintRate;

    event TokenMinted(address recipient, uint256 tokenId);
    event CrossChainTransfer(uint32 indexed dstEid, address indexed from, address indexed to, uint256 tokenId, string tokenURI);

    mapping(address => uint256) private _latestTokenMinted;

    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate,
        string memory baseTokenURI,
        uint256 _initialMintRate
    ) ERC721(_name, _symbol) OFTCore(18, _lzEndpoint, _delegate) {
        _baseTokenURI = baseTokenURI;
        mintRate = _initialMintRate;
    }

    /**
     * @dev Returns the base URI set for the tokens.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns the token URI for the specified token ID.
     */
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
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
        _latestTokenMinted[recipient] = tokenId;
        emit TokenMinted(recipient, tokenId);
    }

    /**
     * @dev Sets the token URI for the specified token ID.
     * @param tokenId The ID of the token.
     * @param _tokenURI The URI to set.
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(bytes(tokenURI(tokenId)).length == 0, "Token URI can only be set once");
        _setTokenURI(tokenId, _tokenURI);
    }

    /**
     * @dev Returns the latest token minted by the specified owner.
     * @param owner The address of the owner.
     */
    function latestTokenMinted(address owner) public view returns (uint256) {
        require(_latestTokenMinted[owner] != 0, "This address hasn't minted any tokens");
        return _latestTokenMinted[owner];
    }

    /**
     * @dev Transfers token cross-chain by burning on the source chain and minting on the destination chain.
     * @param _to The address of the recipient on the destination chain.
     * @param _tokenId The ID of the token to be transferred.
     * @param _dstEid The destination chain ID.
     */
    function crossChainTransfer(
        address _to,
        uint256 _tokenId,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) external payable {
        require(ownerOf(_tokenId) == msg.sender, "Blop5: transfer of token that is not own");

        // Burn the token on the source chain
        _debit(msg.sender, _tokenId, _minAmountLD, _dstEid);

        // Mint the token on the destination chain
        _credit(_to, _tokenId, _dstEid);

        emit CrossChainTransfer(_dstEid, msg.sender, _to, _tokenId, tokenURI(_tokenId));
    }

    /**
     * @dev Burns tokens from the specified address during cross-chain transfer.
     * @param _from The address to burn the token from.
     * @param _tokenId The ID of the token to be burned.
     * @param _dstEid The destination chain ID.
     * @return uint256 The amount sent (which is always 1 for NFT).
     * @return uint256 The amount received (which is always 1 for NFT).
     */
    function _debit(
        address _from,
        uint256 _tokenId,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal virtual override returns (uint256, uint256) {
        require(ownerOf(_tokenId) == _from, "Blop5: transfer of token that is not own");
        _burn(_tokenId);
        return (1, 1); // NFT transfer, amount sent and received is always 1
    }



    /**
     * @dev Credits tokens to the specified address during cross-chain transfer.
     * @param _to The address to credit the tokens to.
     * @param _tokenId The ID of the token to be credited.
     * @param _srcEid The source chain ID.
     * @return uint256 The amount received (which is always 1 for NFT).
     */
    function _credit(
        address _to,
        uint256 _tokenId,
        uint32 _srcEid
    ) internal virtual override returns (uint256) {
        _mint(_to, _tokenId);
        return 1; // NFT transfer, amount received is always 1
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
     * @dev See {ERC721-_burn}.
     */
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @notice Retrieves the address of the token associated with the OFT.
     * @return token The address of the ERC20 token implementation.
     */
    function token() external view virtual override returns (address) {
        return address(this);
    }

    /**
     * @notice Indicates whether the OFT contract requires approval of the 'token()' to send.
     * @return requiresApproval Needs approval of the underlying token implementation.
     *
     * @dev Allows things like wallet implementers to determine integration requirements,
     * without understanding the underlying token implementation.
     */
    function approvalRequired() external view virtual override returns (bool) {
        return true;
    }

    /**
     * @dev See {ERC721-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }



}

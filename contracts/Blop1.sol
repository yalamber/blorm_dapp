// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/onft721/ONFT721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Blop is
    Context,
    AccessControlEnumerable,
    ONFT721,
    ERC721Burnable,
    ERC721Pausable,
    ERC721URIStorage
{
    using Counters for Counters.Counter;

    event TokenMinted(address recipient, uint256 tokenId);

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    Counters.Counter private _tokenIdTracker;
    mapping(uint256 => bool) private _tokenURISet;

    string private _baseTokenURI;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        uint256 minGasToTransfer,
        address lzEndpoint
    ) ONFT721(name, symbol, minGasToTransfer, lzEndpoint) {
        _baseTokenURI = baseTokenURI;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(address to) public virtual {
        _mint(to, _tokenIdTracker.current());
        emit TokenMinted(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(!_tokenURISet[tokenId], "ERC721PresetMinterPauserAutoId: token URI can only be set once");
        _setTokenURI(tokenId, _tokenURI);
        _tokenURISet[tokenId] = true;
    }

    function mintAndSetTokenURI(address recipient, string memory metadataURI) public {
        uint256 tokenId = _tokenIdTracker.current();
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit TokenMinted(recipient, tokenId);
        _tokenIdTracker.increment();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721, ONFT721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
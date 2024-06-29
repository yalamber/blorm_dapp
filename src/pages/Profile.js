import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Profile.module.css';
import NftCard from '../components/NftCard';
import ProfilePicDropdown from '../components/ProfilePicDropdown';
import { ethers } from 'ethers';
import blintChains from '../utils/blintChains.json';
import Navbar from '../components/Navbar';
import AuthButton from '../components/AuthButton';
import editIcon from '../images/edit-pen.png';

const Profile = () => {
  const { user, walletAddress, profile, updateUserProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [nftData, setNftData] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (walletAddress) {
      fetchNfts();
    }
  }, [walletAddress]);

  const fetchNfts = async () => {
    const nftData = {};
    for (const chainId in blintChains) {
      const chain = blintChains[chainId];
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const contract = new ethers.Contract(
        chain.contractAddress,
        [
          'function getTokensOfOwner(address owner) view returns (uint256[] memory)',
          'function tokenURI(uint256 tokenId) view returns (string memory)'
        ],
        provider
      );

      try {
        const tokens = await contract.getTokensOfOwner(walletAddress);
        nftData[chain.name] = await Promise.all(
          tokens.map(async (token) => {
            const tokenId = token.toString();
            const tokenUri = await contract.tokenURI(tokenId);
            const response = await fetch(tokenUri);
            const metadata = await response.json();
            return { tokenId, tokenUri, metadata, chain: chain.name };
          })
        );
      } catch (error) {
        console.error(`Error fetching NFTs on ${chain.name}:`, error);
      }
    }

    setNftData(nftData);
    console.log('NFT Data:', nftData);
  };

  const handleSampleClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleProfilePictureChange = (option) => {
    setLocalProfile((prevProfile) => ({
      ...prevProfile,
      profilePicture: option.metadata.image
    }));
  };

  const handleEditClick = () => {
    if (user) {
      setEditing(true);
    } else {
      setShowModal(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value
    }));
  };

  const handleSave = async () => {
    await updateUserProfile(localProfile);
    setEditing(false);
  };

  const options = Object.values(nftData).flat();

  const sampleProfile = {
    name: "BLORM",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac libero at nunc.",
    profilePicture: "https://gateway.pinata.cloud/ipfs/QmbP6h1DV7aUDt6oHe1q6dEua5GkXmpfKSaVab8UFeoE1o"
  };

  if (!user || !localProfile.eth_address) {
    return (
      <div onClick={handleSampleClick} className={styles.container}>
        <Navbar />
        <div className={styles.profileTop}>
          <div className={styles.profilePicture}>
            <img src={sampleProfile.profilePicture} alt="Profile" className={styles.profileImage} />
          </div>
          <div className={styles.profileName}>
            <span>{sampleProfile.name}</span>
          </div>
          <div className={styles.profileField}>
            <span>{sampleProfile.bio}</span>
          </div>
        </div>
        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Sign in to view your profile</h2>
              <AuthButton />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.profileTop}>
        <div className={styles.profilePicture}>
          {localProfile.profilePicture && (
            <img src={localProfile.profilePicture} alt="Profile" className={styles.profileImage} />
          )}
          <img src={editIcon} alt="Edit" className={styles.editIcon} onClick={handleEditClick} />
        </div>

        <div className={styles.profileName}>
          <span>{localProfile.name}</span>
        </div>
        <div className={styles.profileField}>
          <span>{localProfile.bio}</span>
        </div>

        <div className={`${styles.editPanel} ${editing ? styles.open : ''}`}>
          <div className={styles.editContent}>
            <h2>Edit Profile</h2>
            <div className={styles.profileField}>
              <label>Name:</label>
              <input type="text" name="name" value={localProfile.name} onChange={handleChange} />
            </div>
            <div className={styles.profileField}>
              <label>Bio:</label>
              <input type="text" name="bio" value={localProfile.bio} onChange={handleChange} />
            </div>
            <div className={styles.profileField}>
              <label>Profile Picture:</label>
              <ProfilePicDropdown
                options={options}
                value={options.find((option) => option.metadata.image === localProfile.profilePicture)}
                onChange={handleProfilePictureChange}
              />
            </div>
            <button className={styles.actionButton} onClick={handleSave}>Save</button>
            <button className={styles.actionButton} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.nftData}>
        {Object.keys(nftData).length === 0 ? (
          <div className={styles.noNftsMessage}>No NFTs found.</div>
        ) : (
          Object.entries(nftData).map(([chain, nfts]) => (
            <div key={chain} className={styles.chainSection}>
              <span className={styles.chainLabel}>{chain}</span>
              <div className={styles.nftGrid}>
                {nfts.map((nft, index) => (
                  <NftCard key={index} nft={nft} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;

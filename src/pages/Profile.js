import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Profile.module.css';
import NftCard from '../components/NftCard';
import ProfilePicDropdown from '../components/ProfilePicDropdown';
import { ethers } from 'ethers';
import blintChains from '../utils/blintChains.json';
import Navbar from '../components/Navbar';
import AuthButton from '../components/AuthButton';
import editIcon from '../images/edit-pen.png';
import blop8 from '../utils/Blop8.json';

const Profile = () => {
  const [isMobile, setIsMobile] = useState(false);

  const checkIfMobile = useCallback(() => {
      if (typeof window !== 'undefined') {
          const userAgent = navigator.userAgent || navigator.vendor || window.opera;
          const isMobileDevice = /android|iphone|ipad|iPod|opera mini|iemobile|wpdesktop/i.test(userAgent) ||
              window.innerWidth <= 768;
          setIsMobile(isMobileDevice);
      }
  }, []);

  useEffect(() => {
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const [chainsWithNfts, setChainsWithNfts] = useState([]);
  const { user, walletAddress, profile, updateUserProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [nftData, setNftData] = useState([]);
  const [loadingNfts, setLoadingNfts] = useState(false); // Added state for loading status
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
    setLoadingNfts(true);
    const allNfts = [];
    const chainsWithNfts = new Set();
  
    for (const chainId in blintChains) {
      const chain = blintChains[chainId];
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const abi = blop8.abi;
      const contract = new ethers.Contract(
        chain.contractAddress,
        abi,
        provider
      );
  
      try {
        const tokens = await contract.getTokensByOwner(walletAddress);
        const nfts = await Promise.all(
          tokens.map(async (token) => {
            const tokenId = token.toString();
            const tokenUri = await contract.tokenURI(tokenId);
            const response = await fetch(tokenUri);
            const metadata = await response.json();
            return { tokenId, tokenUri, metadata, chain: chain.name, chainId: chainId };
          })
        );
        if (nfts.length > 0) {
          chainsWithNfts.add(chainId);
        }
        allNfts.push(...nfts);
      } catch (error) {
        console.error(`Error fetching NFTs on ${chain.name}:`, error);
      }
    }
  
    setNftData(allNfts);  // Set the collected NFTs into the state as an array
    setChainsWithNfts([...chainsWithNfts]);  // Set the chains with NFTs into the state as an array
    setLoadingNfts(false);
    console.log('NFT Data:', allNfts);
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
      profilePicture: option.value === 'default' ? "https://gateway.pinata.cloud/ipfs/QmY1HTnkpzJUFVZ9QWo1j51w88NZsV5ZpA32dtv4At9gki" : option.metadata.image
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

  const options = [
    { value: 'default', label: 'Default', metadata: { image: "https://gateway.pinata.cloud/ipfs/QmY1HTnkpzJUFVZ9QWo1j51w88NZsV5ZpA32dtv4At9gki" } },
    ...nftData.map(nft => ({
      value: nft.tokenId,
      label: `${nft.chain} - Token ${nft.tokenId}`,
      metadata: nft.metadata
    }))
  ];
  
  

  const sampleProfile = {
    name: 'BLORMER',
    bio: 'BLORM INFORMATION ON CHAIN',
    profilePicture: "https://gateway.pinata.cloud/ipfs/QmY1HTnkpzJUFVZ9QWo1j51w88NZsV5ZpA32dtv4At9gki"
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
          <div className={styles.profileDisplayField}>
            <span>{sampleProfile.bio}</span>
          </div>
        </div>
        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Sign In To View Your Profile</h2>
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
        <div className={styles.chainIconsContainer}>
          {chainsWithNfts.map(chainId => {
            const chain = blintChains[chainId];
            return (
              <img key={chainId} src={chain.image} alt={chain.name} className={styles.chainIcon} />
            );
          })}
        </div>
        <div className={styles.profilePicture}>
          {localProfile.profilePicture && (
            <img src={localProfile.profilePicture} alt="Profile" className={styles.profileImage} />
          )}
          <img src={editIcon} alt="Edit" className={styles.editIcon} onClick={handleEditClick} />
        </div>
        <div className={styles.profileName}>
          <span>{localProfile.name}</span>
        </div>
        <div className={styles.profileDisplayField}>
          <span>{localProfile.bio}</span>
        </div>
        <div className={`${styles.editPanel} ${editing ? styles.open : ''}`}>
          <div className={styles.editContent}>
            <h2 className={styles.editContentTitle}>Edit Profile</h2>
            <div className={styles.profileFieldContainer}>
              <label>NAME: </label>
              <input className={styles.profileField} type="text" name="name" value={localProfile.name} onChange={handleChange} placeholder='Enter name...'/>
            </div>
            <div className={styles.profileFieldContainer}>
              <label>BIO: </label>
              <input className={styles.profileField} type="text" name="bio" value={localProfile.bio} onChange={handleChange} placeholder='Enter bio...'/>
            </div>
            <div className={styles.profileFieldContainer}>
              <label>Profile Picture:</label>
              <ProfilePicDropdown
                options={options}
                value={options.find((option) => option.metadata.image === localProfile.profilePicture)}
                onChange={handleProfilePictureChange}
              />
            </div>
            <div className={styles.profileFieldContainer}>
              <button className={styles.actionButton} onClick={handleSave}>Save</button>
              <button className={styles.actionButton} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <hr className={styles.divider} />
      <div className={styles.nftData}>
        {loadingNfts ? (
          <div className={styles.loadingMessage}>Fetching NFTs...</div>
        ) : (
          nftData.length === 0 ? (
            <div className={styles.noNftsMessage}>No NFTs found.</div>
          ) : (
            <div className={styles.nftGrid}>
              {isMobile ? (
                nftData.map((nft) => (
                  <NftCard key={nft.tokenId} nft={nft} width={'80%'} />
                ))
              ) : (
                nftData.map((nft) => (
                  <NftCard key={nft.tokenId} nft={nft} width={'25vw'} />
                ))
              )
            }
            </div>
          )
        )}
      </div>
    </div>
  );  
}
  
export default Profile;

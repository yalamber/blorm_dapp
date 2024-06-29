import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Profile.module.css';
import { ethers } from 'ethers';
import blintChains from '../utils/blintChains.json';

const Profile = () => {
  const { user, walletAddress, profile, updateUserProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [nftData, setNftData] = useState({});

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

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
            return { tokenId, tokenUri };
          })
        );
      } catch (error) {
        console.error(`Error fetching NFTs on ${chain.name}:`, error);
      }
    }
  
    setNftData(nftData);
    console.log('NFT Data:', nftData);
  };
  

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Profile</h1>
      <p>Wallet Address: {walletAddress}</p>
      <div className={styles.profileField}>
        <label>Name:</label>
        <span>{localProfile.name}</span>
      </div>
      <div className={styles.profileField}>
        <label>Bio:</label>
        <span>{localProfile.bio}</span>
      </div>
      <div className={styles.profileField}>
        <label>Ethereum Address:</label>
        <span>{localProfile.eth_address}</span>
      </div>
      <div className={styles.profileField}>
        <label>Solana Address:</label>
        <span>{localProfile.sol_address}</span>
      </div>
      <button onClick={() => setEditing(true)}>Edit</button>

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
            <label>Ethereum Address:</label>
            <input type="text" name="eth_address" value={localProfile.eth_address} onChange={handleChange} />
          </div>
          <div className={styles.profileField}>
            <label>Solana Address:</label>
            <input type="text" name="sol_address" value={localProfile.sol_address} onChange={handleChange} />
          </div>
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>

      <div className={styles.nftData}>
        <h2>NFTs</h2>
        <pre>{JSON.stringify(nftData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Profile;

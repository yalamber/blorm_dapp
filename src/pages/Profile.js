import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Profile.module.css';

const Profile = () => {
  const { user, walletAddress, profile, updateUserProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState(profile);
  const [editing, setEditing] = useState(false);

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
    </div>
  );
};

export default Profile;

import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AuthButton.module.css';
import { Link } from 'react-router-dom';
import logoutIcon from '../images/logout.png'

const AuthButton = () => {
  const { user, walletAddress, profile, signOut, handleLogin, loading } = useAuth();

  const abbreviateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (walletAddress && user && profile.eth_address) {
    return (
      <div className={styles.authContainer}>
        <Link to="/profile" className={styles.authContainer}>
          <span className={styles.walletAddress}>{profile.name}</span>
          {profile.profilePicture && (
            <img src={profile.profilePicture} alt="Profile" className={styles.profileImage} />
          )}
          <img className={styles.signOutButton} onClick={signOut} src={logoutIcon}></img>
        </Link>

      </div>
    );
  }

  return (
    <button onClick={handleLogin} disabled={loading} className={styles.loginButton}>
      {loading ? 'Loading...' : 'Login with Ethereum'}
    </button>
  );
};

export default AuthButton;

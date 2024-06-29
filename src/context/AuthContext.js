import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, setPersistence, browserLocalPersistence, signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import { auth, db } from '../utils/firebase';
import blintChains from '../utils/blintChains.json';

const injected = injectedModule();
const wallets = [injected];
const chains = Object.values(blintChains).map(chain => ({
  id: chain.id,
  token: chain.token,
  label: chain.label,
  rpcUrl: chain.rpcUrl,
}));

const onboard = Onboard({
  theme: 'system',
  wallets,
  chains,
});

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  walletAddress: null,
  setWalletAddress: () => {},
  signOut: () => {},
  handleLogin: () => {},
  fetchUserProfile: () => {},
  updateUserProfile: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    eth_address: '',
    sol_address: '',
    profilePicture: '',
  });

  useEffect(() => {
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          setUser(user);
          setLoading(false);
          if (user) {
            await reconnectWallet(); // Attempt to reconnect wallet if user is logged in
          } else {
            setProfile({
              name: '',
              bio: '',
              eth_address: '',
              sol_address: '',
              profilePicture: '',
            });
          }
        });
        return unsubscribe;
      })
      .catch((error) => console.error('Error setting persistence:', error));
  }, []);

  const reconnectWallet = async () => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      const previouslyConnectedWallets = onboard.state.get().wallets;
      if (previouslyConnectedWallets.length > 0) {
        await onboard.connectWallet({
          autoSelect: { label: savedWallet, disableModals: true },
        });
        const walletAddress = previouslyConnectedWallets[0].accounts[0].address;
        setWalletAddress(walletAddress);

        // Fetch user profile after reconnecting wallet
        if (user) {
          const profileData = await fetchUserProfile(user.uid);
          if (profileData) {
            setProfile(profileData);
          }
        }
      }
    }
  };

  const handleLogin = async () => {
    try {
      const [wallet] = await onboard.connectWallet();
      if (wallet) {
        const walletAddress = wallet.accounts[0].address;
        setWalletAddress(walletAddress);
        localStorage.setItem('connectedWallet', wallet.label);

        const response = await fetch('https://us-central1-blorm-dapp.cloudfunctions.net/createCustomToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletAddress }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { token } = await response.json();
        const userCredential = await signInWithCustomToken(auth, token);
        const uid = userCredential.user.uid;

        // Check if the profile exists
        const userProfileRef = doc(db, 'profiles', uid);
        const userProfileSnap = await getDoc(userProfileRef);
        if (!userProfileSnap.exists()) {
          // Create the profile with eth_address set to the UID
          await setDoc(userProfileRef, {
            eth_address: uid,
            name: 'BLORM User',
            bio: 'We are focusing on building a conglomerate aggregator to create the easiest and most affordable way to send information onchain',
            sol_address: '',
            profilePicture: 'https://gateway.pinata.cloud/ipfs/QmY1HTnkpzJUFVZ9QWo1j51w88NZsV5ZpA32dtv4At9gki',
          });
        }

        // Fetch the profile data again after creation
        const profileData = await fetchUserProfile(uid);
        if (profileData) {
          setProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      await onboard.disconnectWallet();  // Disconnect the wallet
      localStorage.removeItem('connectedWallet');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setWalletAddress(null);
      setUser(null);
      setProfile({
        name: '',
        bio: '',
        eth_address: '',
        sol_address: '',
        profilePicture: '',
      });
    }
  };

  const fetchUserProfile = async (uid) => {
    const userProfileRef = doc(db, 'profiles', uid);
    const userProfileSnap = await getDoc(userProfileRef);
    if (userProfileSnap.exists()) {
      return userProfileSnap.data();
    } else {
      console.log('No such document!');
      return null;
    }
  };

  const updateUserProfile = async (profileData) => {
    if (user) {
      const userProfileRef = doc(db, 'profiles', user.uid);
      await setDoc(userProfileRef, profileData, { merge: true });
      setProfile(profileData); // Update local profile state
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        walletAddress,
        profile,
        setWalletAddress,
        signOut,
        handleLogin,
        fetchUserProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

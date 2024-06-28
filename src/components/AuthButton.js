import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthButton = () => {
  const { walletAddress, setWalletAddress, signOut, handleLogin, loading } = useAuth();

  if (walletAddress) {
    return (
      <div>
        <span>{walletAddress}</span>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Loading...' : 'Login with Ethereum'}
    </button>
  );
};

export default AuthButton;

import React from 'react';
import AddPeer from '../components/AddPeer';
import SendString from '../components/SendString';
import FetchMessage from '../components/FetchMessage';
import MintToken from '../components/MintToken';
import SendToken from '../components/SendToken';
import CheckPeer from '../components/CheckPeer';

function Home() {
  return (
    <div className="container">
      <h1>LayerZero Testnet</h1>
      <AddPeer />
      <CheckPeer />
      <SendString />
      <FetchMessage />
      <MintToken />
      <SendToken />
    </div>
  );
}

export default Home;
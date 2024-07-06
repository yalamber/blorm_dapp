import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Blap.module.css';
import LoadingBlap from '../components/LoadingBlap';
import * as chainRegistry from 'chain-registry';
import { executeRoute } from '../utils/skipUtils.js'; // Import the function directly
import customChains from '../utils/customChains.json';
import customAssets from '../utils/customAssets.json'; // Import custom assets
import { ethers } from 'ethers';
import * as solanaWeb3 from '@solana/web3.js';

const Blap = () => {

  const [showLoading, setShowLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [chains, setChains] = useState([]);
  const [selectedSourceChain, setSelectedSourceChain] = useState(null);
  const [selectedSourceAsset, setSelectedSourceAsset] = useState(null);
  const [selectedDestinationChain, setSelectedDestinationChain] = useState(null);
  const [selectedDestinationAsset, setSelectedDestinationAsset] = useState(null);

  const [sourceAmount, setSourceAmount] = useState('');
  const [destinationAmount, setDestinationAmount] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [destinationError, setDestinationError] = useState('');

  const [sourceChainSearch, setSourceChainSearch] = useState('');
  const [sourceAssetSearch, setSourceAssetSearch] = useState('');
  const [destinationChainSearch, setDestinationChainSearch] = useState('');
  const [destinationAssetSearch, setDestinationAssetSearch] = useState('');

  const [isSourceChainDropdownOpen, setIsSourceChainDropdownOpen] = useState(false);
  const [isSourceAssetDropdownOpen, setIsSourceAssetDropdownOpen] = useState(false);
  const [isDestinationChainDropdownOpen, setIsDestinationChainDropdownOpen] = useState(false);
  const [isDestinationAssetDropdownOpen, setIsDestinationAssetDropdownOpen] = useState(false);

  const [routeResponse, setRouteResponse] = useState(null); // State variable for storing route response
  const [msgResponse, setMsgResponse] = useState(null); // State variable for storing msg response
  const [addresses, setAddresses] = useState({}); // State variable for storing addresses

  const sourceChainRef = useRef(null);
  const sourceAssetRef = useRef(null);
  const destinationChainRef = useRef(null);
  const destinationAssetRef = useRef(null);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const response = await fetch('https://api.skip.money/v2/info/chains');
        const data = await response.json();
        const allChains = [...data.chains, ...customChains].sort((a, b) => a.chain_name.localeCompare(b.chain_name));
        setChains(allChains);
      } catch (error) {
        console.error('Error fetching chains:', error);
      }
    };

    fetchChains();
  }, []);

  const handleSourceChainChange = (chainName) => {
    const chain = chains.find(c => c.chain_name === chainName);
    setSelectedSourceChain(chain);
    setSourceChainSearch(chain.chain_name);

    if (customAssets.chain_to_assets_map[chain.chain_id]) {
      const matchingAssets = customAssets.chain_to_assets_map[chain.chain_id].assets;
      setAssets(matchingAssets);
    } else {
      const matchingAssets = chain.fee_assets.map(asset => {
        const registryAsset = chainRegistry.assets.find(a => a.base === asset.denom);
        return registryAsset ? { ...asset, ...registryAsset } : asset;
      });
      setAssets(matchingAssets);
    }

    setIsSourceChainDropdownOpen(false);
    handleRoute(); // Call handleRoute
  };

  const handleSourceAssetChange = (assetBase) => {
    const asset = assets.find(a => a.denom === assetBase);
    setSelectedSourceAsset(asset);
    setSourceAssetSearch(asset.denom);
    setIsSourceAssetDropdownOpen(false);
    handleRoute(); // Call handleRoute
  };

  const handleDestinationChainChange = (chainName) => {
    const chain = chains.find(c => c.chain_name === chainName);
    setSelectedDestinationChain(chain);
    setDestinationChainSearch(chain.chain_name);

    if (customAssets.chain_to_assets_map[chain.chain_id]) {
      const matchingAssets = customAssets.chain_to_assets_map[chain.chain_id].assets;
      setAssets(matchingAssets);
    } else {
      const matchingAssets = chain.fee_assets.map(asset => {
        const registryAsset = chainRegistry.assets.find(a => a.base === asset.denom);
        return registryAsset ? { ...asset, ...registryAsset } : asset;
      });
      setAssets(matchingAssets);
    }

    setIsDestinationChainDropdownOpen(false);
    handleRoute(); // Call handleRoute
  };

  const handleDestinationAssetChange = (assetBase) => {
    const asset = assets.find(a => a.denom === assetBase);
    setSelectedDestinationAsset(asset);
    setDestinationAssetSearch(asset.denom);
    setIsDestinationAssetDropdownOpen(false);
    handleRoute(); // Call handleRoute
  };

  const handleSourceAmountChange = (event) => {
    setSourceAmount(event.target.value);
    handleRoute(); // Call handleRoute
  };

  const handleDestinationAmountChange = (event) => {
    setDestinationAmount(event.target.value);
  };

  const handleClickOutside = (event) => {
    if (
      sourceChainRef.current && !sourceChainRef.current.contains(event.target)
      && sourceAssetRef.current && !sourceAssetRef.current.contains(event.target)
      && destinationChainRef.current && !destinationChainRef.current.contains(event.target)
      && destinationAssetRef.current && !destinationAssetRef.current.contains(event.target)
    ) {
      setIsSourceChainDropdownOpen(false);
      setIsSourceAssetDropdownOpen(false);
      setIsDestinationChainDropdownOpen(false);
      setIsDestinationAssetDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredSourceChains = chains.filter(chain =>
    chain.chain_name?.toLowerCase().includes(sourceChainSearch.toLowerCase())
  );

  const filteredSourceAssets = assets.filter(asset =>
    asset.denom?.toLowerCase().includes(sourceAssetSearch.toLowerCase())
  );

  const filteredDestinationChains = chains.filter(chain =>
    chain.chain_name?.toLowerCase().includes(destinationChainSearch.toLowerCase())
  );

  const filteredDestinationAssets = assets.filter(asset =>
    asset.denom?.toLowerCase().includes(destinationAssetSearch.toLowerCase())
  );

  const handleRoute = async () => {
    if (!selectedSourceAsset || !selectedSourceChain || !selectedDestinationAsset || !selectedDestinationChain) {
      // console.error("Please ensure all selections are made before routing.");
      return;
    }

    // console.log('selected options: ', selectedSourceAsset, selectedSourceChain, selectedDestinationAsset, selectedDestinationChain)

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_in: sourceAmount,
        source_asset_denom: selectedSourceAsset.denom,
        source_asset_chain_id: selectedSourceChain.chain_id,
        dest_asset_denom: selectedDestinationAsset.denom,
        dest_asset_chain_id: selectedDestinationChain.chain_id,
        allow_unsafe: true,
        allow_multi_tx: true,
        smart_relay: true,
        smart_swap_options: {
          split_routes: true,
          evm_swaps: true,
        },
        allow_swaps: true
      })
    };

    console.log('getting route with: ', options)
    try {
      const response = await fetch('https://api.skip.money/v2/fungible/route', options);
      const data = await response.json();
      setRouteResponse(data); // Save response data in state

      if (data.required_chain_addresses) {
        const fetchedAddresses = await getAddresses(data.required_chain_addresses);
        setAddresses(fetchedAddresses); // Save addresses in state
        console.log('Addresses:', fetchedAddresses);
      }
      setDestinationAmount(data.amount_out);
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  useEffect(() => {
    if (routeResponse && routeResponse.amount_out) {
      setDestinationAmount(routeResponse.amount_out);
    } else {
      setDestinationAmount("Enter a source amount");
    }
  }, [routeResponse]);

  useEffect(() => {
    handleRoute();
  }, [selectedSourceAsset, selectedSourceChain, selectedDestinationAsset, selectedDestinationChain, sourceAmount]);

  const handleMsgSend = async () => {

    if (!routeResponse) {
      console.error("No route response to use for the message send.");
      return;
    }

    const { source_asset_denom, source_asset_chain_id, dest_asset_denom, dest_asset_chain_id, amount_in, amount_out, operations } = routeResponse;
    console.log('sending msg with:', source_asset_denom, source_asset_chain_id, dest_asset_denom, dest_asset_chain_id, amount_in, amount_out, addresses, operations);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_asset_denom,
        source_asset_chain_id,
        dest_asset_denom,
        dest_asset_chain_id,
        amount_in,
        amount_out,
        address_list: Object.values(addresses),
        operations,
        slippage_tolerance_percent: "1"
      })
    };

    try {
      const response = await fetch('https://api.skip.money/v2/fungible/msgs', options);
      const data = await response.json();
      setMsgResponse(data); // Save msg response in state
      console.log('Msg Response:', data);
    } catch (error) {
      console.error('Error sending msg:', error);
    }
  };

  const getAddresses = async (chainIds) => {
    const addresses = {};
  
    for (const chainId of chainIds) {
      if (chainId === "1" || chainId === "8453") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        addresses[chainId] = await signer.getAddress();
      } 
      else if (chainId === "solana") {
        // using Phantom Wallet for this example
        if (window.solana && window.solana.isPhantom) {
          try {
            await window.solana.connect();
            addresses[chainId] = window.solana.publicKey.toString();
          } catch (error) {
            console.error("Error connecting to Solana wallet:", error);
          }
        } else {
          alert("Please install the Phantom wallet extension.");
          return;
        }
      } 
      else {
        if (!window.keplr) {
          alert("Please install Keplr extension");
          return;
        }
        await window.keplr.enable(chainId);
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        addresses[chainId] = accounts[0].address;
      }
      console.log('Addresses from getAddresses:', addresses);
    }
    
    return addresses;
  };

  const handleExecuteRoute = async () => {
    if (!routeResponse) {
      console.error("No route response to use for the execute route.");
      return;
    }
    console.log('Executing route with:', msgResponse, addresses)
    const response = await executeRoute(msgResponse.txs, addresses); // Correctly call the function
    console.log('Execute Route Response:', response);
  };

  return (
    <div className={styles.container}>
      {showLoading && <LoadingBlap />}
      <div className={styles.swapContainer}>
        <div className={styles.swap}>
          <div className={styles.swapInputSourceContainer}>
            <div className={styles.swapInputDropdownContainer}>
              <div className={styles.swapSectionInputSourceChain} ref={sourceChainRef}>
                <input
                  type="text"
                  placeholder="Search Source Chain"
                  value={sourceChainSearch}
                  onChange={e => setSourceChainSearch(e.target.value)}
                  className={styles.searchInput}
                  onFocus={() => setIsSourceChainDropdownOpen(true)}
                />
                {isSourceChainDropdownOpen && filteredSourceChains.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredSourceChains.map((chain) => (
                      <div
                        key={chain.chain_id}
                        className={styles.dropdownItem}
                        onClick={() => handleSourceChainChange(chain.chain_name)}
                      >
                        {chain.chain_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.swapSectionInputSourceToken} ref={sourceAssetRef}>
                <input
                  type="text"
                  placeholder="Search Source Asset"
                  value={sourceAssetSearch}
                  onChange={e => setSourceAssetSearch(e.target.value)}
                  className={styles.searchInput}
                  onFocus={() => setIsSourceAssetDropdownOpen(true)}
                />
                {isSourceAssetDropdownOpen && filteredSourceAssets.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredSourceAssets.map((asset) => (
                      <div
                        key={`${asset.denom}`}
                        className={styles.dropdownItem}
                        onClick={() => handleSourceAssetChange(asset.denom)}
                      >
                        {asset.name || asset.denom}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
            <div className={styles.swapInputAmountContainer}>
              <input
                className={styles.swapInputAmount}
                type="text"
                placeholder="0.0"
                value={sourceAmount}
                onChange={handleSourceAmountChange}
              />
              {sourceError && <span className={styles.errorText}>{sourceError}</span>}
            </div>
          </div>
          <div className={styles.swapInputDestinationContainer}>
            <div className={styles.swapInputDropdownContainer}>
              <div className={styles.swapInputDestinationChain} ref={destinationChainRef}>
                <input
                  type="text"
                  placeholder="Search Destination Chain"
                  value={destinationChainSearch}
                  onChange={e => setDestinationChainSearch(e.target.value)}
                  className={styles.searchInput}
                  onFocus={() => setIsDestinationChainDropdownOpen(true)}
                />
                {isDestinationChainDropdownOpen && filteredDestinationChains.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredDestinationChains.map((chain) => (
                      <div
                        key={chain.chain_id}
                        className={styles.dropdownItem}
                        onClick={() => handleDestinationChainChange(chain.chain_name)}
                      >
                        {chain.chain_name}
                      </div>
                    ))}
                  </div>
                )}

              </div>
              <div className={styles.swapInputDestinationToken} ref={destinationAssetRef}>
                <input
                  type="text"
                  placeholder="Search Destination Asset"
                  value={destinationAssetSearch}
                  onChange={e => setDestinationAssetSearch(e.target.value)}
                  className={styles.searchInput}
                  onFocus={() => setIsDestinationAssetDropdownOpen(true)}
                />
                {isDestinationAssetDropdownOpen && filteredDestinationAssets.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredDestinationAssets.map((asset) => (
                      <div
                        key={`${asset.denom}`}
                        className={styles.dropdownItem}
                        onClick={() => handleDestinationAssetChange(asset.denom)}
                      >
                        {asset.name || asset.denom}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
            <div className={styles.swapInputAmountContainer}>
              <input
                className={styles.swapInputAmount}
                type="text"
                placeholder="0.0"
                value={destinationAmount}
                readOnly // Make the input read-only
              />
              {destinationError && <span className={styles.errorText}>{destinationError}</span>}
            </div>
          </div>
        </div>
        <div className={styles.swapAction}>
          <button onClick={handleMsgSend} className={styles.msgButton}>Send Msg</button>
          <button onClick={handleExecuteRoute} className={styles.executeRouteButton}>Execute Route</button>
        </div>
        {routeResponse && (
          <div className={styles.responseContainer}>
            <h3>Route Response</h3>
            <pre>{JSON.stringify(routeResponse, null, 2)}</pre>
          </div>
        )}
        {msgResponse && (
          <div className={styles.responseContainer}>
            <h3>Msg Response</h3>
            <pre>{JSON.stringify(msgResponse, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blap;
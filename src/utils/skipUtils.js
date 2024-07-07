'use strict';

const { ethers } = require('ethers');
const { SigningStargateClient } = require('@cosmjs/stargate');
const { Connection, Transaction, TransactionInstruction } = require('@solana/web3.js');

// Function to fetch RPC endpoint from Ping Pub registry
async function getRpcEndpoint(chainId) {
  // Remove any numbering after the chain_id (e.g., noble-1 to noble)
  const cleanChainId = chainId.split('-')[0];
  const response = await fetch(`https://registry.ping.pub/${cleanChainId}/chain.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chain information for chain ID: ${chainId}`);
  }

  const chainInfo = await response.json();
  if (!chainInfo.apis || !chainInfo.apis.rpc || chainInfo.apis.rpc.length === 0) {
    throw new Error(`RPC endpoint not found for chain ID: ${chainId}`);
  }

  return chainInfo.apis.rpc[0].address; // Assuming the first RPC endpoint is preferred
}

// Function to execute a transaction for Cosmos
async function executeCosmosTx(tx) {
  if (!window.keplr) {
    throw new Error('Keplr extension is not installed');
  }

  // Enable Keplr and get offline signer
  await window.keplr.enable(tx.chain_id);
  const offlineSigner = window.getOfflineSigner(tx.chain_id);
  const accounts = await offlineSigner.getAccounts();
  const sender = accounts[0].address;

  const rpcEndpoint = await getRpcEndpoint(tx.chain_id);
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, offlineSigner);

  const executeMsg = {
    typeUrl: tx.msg_type_url,
    value: {
      sender,
      contract: tx.contract,
      msg: tx.msg,
      funds: tx.funds || [],
    },
  };

  // Dynamically use the fee denomination from the transaction data
  const fee = {
    amount: [{ denom: tx.feeDenom, amount: tx.feeAmount }],
    gas: tx.gas || '200000',
  };

  const result = await client.signAndBroadcast(sender, [executeMsg], fee, 'Executing contract');
  return result;
}

// Function to execute a transaction for EVM
async function executeEvmTx(tx) {
  if (!window.ethereum) {
    throw new Error('MetaMask extension is not installed');
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const txResponse = await signer.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value || 0,
    gasLimit: tx.gasLimit || 1000000,
    gasPrice: tx.gasPrice || ethers.utils.parseUnits('20', 'gwei'),
  });

  const receipt = await txResponse.wait();
  return receipt;
}

// Function to execute a transaction for Solana
async function executeSolanaTx(tx) {
  if (!window.phantom) {
    throw new Error('Phantom extension is not installed');
  }

  const provider = window.phantom.solana;
  const connection = new Connection(tx.rpc_endpoint, 'confirmed');

  const { publicKey } = await provider.connect();
  const transaction = new Transaction().add(...tx.instructions.map((ix) => TransactionInstruction.from(ix)));
  transaction.feePayer = publicKey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signedTransaction = await provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}

async function executeRoute(txs, addresses) {
    const results = [];
    if (!txs || txs.length === 0) {
        throw new Error('No transactions to execute');
    }
    for (const tx of txs) {
        console.log('Executing transaction:', tx);
        if (tx.cosmos_tx) {
            results.push(await executeCosmosTx(tx.cosmos_tx));
        } else if (tx.evm_tx) {
            results.push(await executeEvmTx(tx.evm_tx));
        } else if (tx.solana_tx) {
            results.push(await executeSolanaTx(tx.solana_tx));
        } else {
            throw new Error(`Unsupported chain type in transaction: ${JSON.stringify(tx)}`);
        }
    }
    return results;
}

module.exports = {
  executeRoute,
};

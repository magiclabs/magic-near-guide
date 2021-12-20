import React, { useEffect, useState, useCallback } from "react";
import { useHistory } from "react-router";
import { magic } from "../magic";
import Loading from "./Loading";
import * as nearAPI from "near-api-js";

let near = undefined;

export default function Profile() {
  const [txHash, setTxHash] = useState("");
  const [balance, setBalance] = useState(0);
  const [sendAmount, setSendAmount] = useState(0);
  const [userMetadata, setUserMetadata] = useState();
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const history = useHistory();
  const networkId = "testnet"; // testnet, betanet, or mainnet

  useEffect(() => {
    // Create NEAR instance
    (async () => {
      const { connect, keyStores } = nearAPI;

      const config = {
        networkId,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: `https://rpc.${networkId}.near.org`,
        walletUrl: `https://wallet.${networkId}.near.org`,
        helperUrl: `https://helper.${networkId}.near.org`,
        explorerUrl: `https://explorer.${networkId}.near.org`,
      };
    
      // connect to NEAR
      near = await connect(config);
    })();

    // If user is logged in, retrieve the authenticated user's profile.
    magic.user.isLoggedIn().then(magicIsLoggedIn => {
      if (magicIsLoggedIn) {
        magic.user.getMetadata().then(user => {
          setUserMetadata(user);
          fetchBalance(user.publicAddress);
        });
      } else {
        // If no user is logged in, redirect to `/login`
        history.push("/login");
      }
    });
  }, []);

  const fetchBalance = async (address) => {
    const account = await near.account(address);
    account.getAccountBalance().then(bal => setBalance(nearAPI.utils.format.formatNearAmount(bal.total))); 
  }

  const sendTransaction = async () => {
    if (!sendAmount || !destinationAddress) return;
    setSendingTransaction(true);
    setTxHash(false);
    const publicKeyString = await magic.near.getPublicKey();
    const publicKey = nearAPI.utils.PublicKey.fromString(publicKeyString);

    // Grabbing the account nonce
    const provider = new nearAPI.providers.JsonRpcProvider(
      `https://rpc.${networkId}.near.org`
    );
    const accessKey = await provider.query(
      `access_key/${userMetadata.publicAddress}/${publicKey.toString()}`,
      ""
    );
    const nonce = ++accessKey.nonce; // increment current nonce for next transaction

    const actions = [nearAPI.transactions.transfer(nearAPI.utils.format.parseNearAmount(sendAmount))];

    // Near transactions must be sent with the blockhash of a block mined within the last 24 hours
    const status = await near.connection.provider.status();
    const blockHash = status.sync_info.latest_block_hash;
    const serializedBlockHash = nearAPI.utils.serialize.base_decode(blockHash);    

    const transaction = nearAPI.transactions.createTransaction(
      userMetadata.publicAddress, // sender address
      publicKey, // sender public key
      destinationAddress, // receiver
      nonce, // sender account nonce
      actions, // transaction instructions
      serializedBlockHash // hash of a block mined within prev 24 hours
    );

    const rawTransaction = transaction.encode();
    const result = await magic.near.signTransaction({rawTransaction, networkID: networkId});
    const signedTransaction = nearAPI.transactions.SignedTransaction.decode(Buffer.from(result.encodedSignedTransaction));
    const receipt = await near.connection.provider.sendTransaction(signedTransaction);
    console.log(receipt);
    setTxHash(receipt.transaction.hash);
    fetchBalance(userMetadata.publicAddress);
    setDestinationAddress("");
    setSendAmount("");
    setSendingTransaction(false);
  }

  /**
   * Perform logout action via Magic.
   */
  const logout = useCallback(() => {
    magic.user.logout().then(() => {
      history.push("/login");
    })
  }, [history]);

  return userMetadata ? <>
      <div className="container">
        <h1>Current user: {userMetadata.email || userMetadata.phoneNumber}</h1>
        <button onClick={logout}>Logout</button>
      </div>
      <div className="container">
          <h1>Near account id</h1>
          <div className="info">{userMetadata.publicAddress}</div>
      </div>
      <div className="container">
          <h1>Near Balance</h1>
          <div className="info">{balance} NEAR</div>
          <div><a href="https://wallet.testnet.near.org" target="_blank">Get testnet tokens</a></div>
      </div>
      <div className="container">
        <h1>Send Near Transaction</h1>
        <input
            type="text"
            name="destination"
            className="full-width"
            required="required"
            placeholder="Destination address"
            onChange={(event) => {
                setDestinationAddress(event.target.value);
            }}
        />
        <input
            type="text"
            name="amount"
            className="full-width"
            required="required"
            placeholder="Amount in Near"
            onChange={(event) => {
                setSendAmount(event.target.value);
            }}
        />
        <button id="btn-send-txn" onClick={sendTransaction}>
            Send Transaction
        </button>
        {txHash && <div>
          <a href={`https://explorer.testnet.near.org/transactions/${txHash}`} target="_blank">
            View in Explorer
          </a>
        </div>}
        {sendingTransaction && <div>Sending transaction...</div>}
    </div>
  </> : <Loading />;
}


## Resources
- [Github Repo](https://github.com/magiclabs/magic-near-guide.git)
- [Live Demo](https://magic-near.vercel.app/login)

## Quick Start
```
$ git clone https://github.com/magiclabs/magic-near-guide.git
$ cd magic-near-guide
// Enter your Magic API key in `.env` such as REACT_APP_MAGIC_PUBLISHABLE_KEY=pk_live_abc123
$ yarn
$ yarn start
// Visit your app on http://localhost:3000
```

## What is NEAR

NEAR Protocol is a layer-one blockchain with features that include Proof-of-Stake consensus, smart contract support, high scalability through sharding, and human-readable addressing. 

Dissimilar to Ethereum and EVM-compatible chains which use the Solidity programming language, smart contracts on NEAR are written in Rust or AssemblyScript (similar to JavaScript). Building on the NEAR blockchain allows developers to build decentralized and serverless applications that maintain security while also providing scalability that popular dApps require. The high transaction throughput is enabled through sharding, which divides the computation required from nodes, so each only need to process transactions relevant to their respective shard.

An important differentiator with NEAR compared to other layer-one's is they support human-readable accounts at the base layer, such as `magic.near`, instead of non-human-readable addresses such as `92130c8ab2c23a33...` found in other blockchains. This makes NEAR a user-friendly blockchain for developers to build on. 

The native token for the blockchain is NEAR, which is used to pay for all transaction fees on the platform.

## Get Testnet Tokens

1. Create a test wallet on [wallet.testnet.near.org](https://wallet.testnet.near.org). 200 NEAR test tokens will automatically be deposited to your wallet.
2. Login to your Magic-NEAR app with email, facebook, or phone number to get your public address.
3. Transfer funds from your `your-account.testnet` wallet on wallet.testnet.near.org to your Magic wallet.

## Tutorial

At the end of this tutorial, your end users will be able to login to your dapp with just an email, social provider, or phone number, create a NEAR wallet, then receive and transfer funds.

## Dependencies

```
$ yarn add magic-sdk @magic-ext/near @magic-ext/oauth near-api-js
```

### Login With Magic

Magic's `NearExtension` is required in order to access NEAR-specific sdk methods. The extension allows for Magic to manage NEAR private keys through our Delegated Key Management. Transactions are only signed by Magic, rather than sent by Magic, which is why the `rpcUrl` key is empty. 

```js
import { Magic } from 'magic-sdk';
import { NearExtension } from "@magic-ext/near";
import { OAuthExtension } from '@magic-ext/oauth';
 
export const magic = new Magic(process.env.REACT_APP_MAGIC_PUBLISHABLE_KEY, {
 extensions: [
     new NearExtension({
         rpcUrl: '',
     }),
     new OAuthExtension()
 ]}
);
```

The Magic login flow sends a magic link to a user's inbox, which when clicked, authenticates them on your app while also generating a random private key and NEAR public address. This one line kicks off the entire flow on behalf of the developer, `await magic.auth.loginWithMagicLink({ email });`.

```js
// Login.js
const login = useCallback(async () => {
 setIsLoggingIn(true);
 
 try {
   await magic.auth.loginWithMagicLink({ email });
   history.push("/");
 } catch {
   setIsLoggingIn(false);
 }
}, [email]);
```

Users can also login with their phone number.

```js
// Login.js
const loginWithSMS = useCallback(async () => {
  setIsLoggingIn(true);
  try {
    await magic.auth.loginWithSMS({ phoneNumber });
    history.push("/");
  } catch (err) {
    console.log(err);
    setIsLoggingIn(false);
  }
}, [phoneNumber]);
 ```

Lastly, Magic also supports social providers, such as Facebook. This function takes two parameters, first being the social provider (facebook, google, apple, etc) and second being a callback URL for where the user should get directed to on your application after authenticating with the social provider and Magic.

```js
// Login.js
const handleLoginWithFacebook = async (e) => {
  e.preventDefault();
  await magic.oauth.loginWithRedirect({
    provider: "facebook",
    redirectURI: `${window.location.origin}/callback`
  });
};
```

To handle the callback, we can simply call `magic.oauth.getRedirectResult()` which will return the user details returned from the social provider.

```js
// Callback.js
useEffect(() => {
    magic.oauth.getRedirectResult().then((result) => {
      console.log(result);
      history.push("/");
    });
}, []);
```

You can also allow a user to logout with the following code snippet.

```js
// Profile.js
const logout = useCallback(() => {
 magic.user.logout().then(() => {
   history.push("/login");
 })
}, [history]);
```

### Display User Data

After a user has successfully logged in, you can display their data, such as `email` and `public address`.

```js
// Profile.js
const [userMetadata, setUserMetadata] = useState();
 
useEffect(() => {
 // If user is logged in, retrieve the authenticated user's profile.
 magic.user.isLoggedIn().then(magicIsLoggedIn => {
   if (magicIsLoggedIn) {
     magic.user.getMetadata().then(user => {
       setUserMetadata(user);
     });
   } else {
     // If no user is logged in, redirect to `/login`
     history.push("/login");
   }
 });
}, []);
 
return (
 <>
   <div>Email</div>
   <div>{userMetadata.email}</div>
   <div>NEAR Address</div>
   <div>{userMetadata.publicAddress}</div>
 </>
)
```

You can also use the `near-api-js` package to connect to the NEAR blockchain node to fetch a user's balance (and later send a transaction).

```js
import * as nearAPI from "near-api-js";
 
const [balance, setBalance] = useState(0);
const networkId = "testnet"; // testnet, betanet, or mainnet
 
useEffect(() => {
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
})
 
const fetchBalance = async (address) => {
 const account = await near.account(address);
 account.getAccountBalance().then(bal => setBalance(nearAPI.utils.format.formatNearAmount(bal.total)));
}
 
return (
 <>
   <div>Balance</div>
   <div>{balance} NEAR</div>
 </>
)
```
### Send Transaction

In transferring assets on the NEAR blockchain, Magic's role is signing the transaction object since Magic is the key management provider. We then use the `near` instance to send the signed transaction to the network. A NEAR transaction consists of six fields, each broken down below.

1. `sender`: the sender's public address (can be either the raw 64-character public address, or `.near` syntax such as `bob.near`)
2. `publicKey`: the sending address' public key, which is an object with two key value pairs, `keyType` and `data`.
3. `receiver`: the receiving public address (can be either the raw 64-character public address, or `.near` syntax such as `bob.near`)
4. `nonce`: this number represents the number of transactions that an account has sent (including the transaction being constructed), and is meant to prevent replay attacks. The first transaction sent from a user's wallet will have `nonce: 1`, the second will have `nonce: 2`, etc.
5. `actions`: describes what should be done at the receiver's end. `Transfer` represents sendings funds from one wallet to another, `DeployContract` represents a contract deployment transaction. In total there are eight different transaction types.
6. `recentBlockHash`: each transaction is required to be sent with the hash of a block from the last 24 hours to prove the transaction was recently created.

This is what a `sendTransaction` function with Magic can look like.

```js
const sendTransaction = async () => {
 // Grab user's public key from Magic
 const publicKeyString = await magic.near.getPublicKey();
 const publicKey = nearAPI.utils.PublicKey.fromString(publicKeyString);
 
 // Calculate the sending account's nonce
 const provider = new nearAPI.providers.JsonRpcProvider(
   `https://rpc.${networkId}.near.org`
 );
 const accessKey = await provider.query(
   `access_key/${userMetadata.publicAddress}/${publicKey.toString()}`,
   ""
 );
 const nonce = ++accessKey.nonce;
 
 // Calculate `actions`
 const actions = [nearAPI.transactions.transfer(nearAPI.utils.format.parseNearAmount(sendAmount))];
 
 // Create recent block hash
 const status = await near.connection.provider.status();
 const blockHash = status.sync_info.latest_block_hash;
 const serializedBlockHash = nearAPI.utils.serialize.base_decode(blockHash);   
 
 // Construct transaction object
 const transaction = nearAPI.transactions.createTransaction(
   userMetadata.publicAddress,
   publicKey,
   destinationAddress,
   nonce,
   actions,
   serializedBlockHash
 );
 
 const rawTransaction = transaction.encode();
  // Sign raw transaction with Magic
 const result = await magic.near.signTransaction({rawTransaction, networkID: networkId});
 const signedTransaction = nearAPI.transactions.SignedTransaction.decode(Buffer.from(result.encodedSignedTransaction));
 
 // Send the signed transaction with `near`
 const receipt = await near.connection.provider.sendTransaction(signedTransaction);
 console.log(receipt);
}
```

## Conclusion

You now have an application that allows a user to generate a NEAR wallet with just their email and transfer funds!

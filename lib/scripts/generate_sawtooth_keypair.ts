const {createContext, CryptoFactory} = require('sawtooth-sdk/signing')

const ctx = createContext('secp256k1')
const privateKey = ctx.newRandomPrivateKey();
const cf = new CryptoFactory(ctx);
const signer = cf.newSigner(privateKey)
console.log('privateKey='+privateKey.asHex());
console.log('publicKey='+signer.getPublicKey().asHex());

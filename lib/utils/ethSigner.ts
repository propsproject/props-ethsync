import { fn } from "moment";

const ETH_SIGN_NOT_SUPPORTED_ERROR_MSG = 'ETH_SIGN_NOT_SUPPORTED'
const EMPTY_DATA = '0x';
export const ethSign = async(web3, txHash, sender) => {    
  return new Promise(function (resolve, reject) {              
    console.log(`web3.eth.defaultAccount=${web3.eth.defaultAccount}`);
    web3.eth.sign(txHash, sender).then(
      async function (signature) {
          console.log(`signature=${JSON.stringify(signature)}`);        
        if (signature == null) {
          reject(new Error(ETH_SIGN_NOT_SUPPORTED_ERROR_MSG))
          return
        }

        const sig = signature.replace(EMPTY_DATA, '')
        let sigV = parseInt(sig.slice(-2), 16)

        // Metamask with ledger returns v = 01, this is not valid for ethereum
        // For ethereum valid V is 27 or 28
        // In case V = 0 or 01 we add it to 27 and then add 4
        // Adding 4 is required to make signature valid for safe contracts:
        // https://gnosis-safe.readthedocs.io/en/latest/contracts/signatures.html#eth-sign-signature
        switch (sigV) {
          case 0:
          case 1:
            sigV += 31
            break
          case 27:
          case 28:
            sigV += 4
            break
          default:
            throw new Error('Invalid signature')
        }

        resolve(sig.slice(0, -2) + sigV.toString(16))
      },
    )
  })
}
const Web3 = require('web3');
const Bitski = require('bitski-node');
import Utils from '../utils/utils';


import config from '../config';

export default class BitskiTransfer {

  web3 = new Web3(config.settings.ethereum.uri);



  /**
   * Generates a new wallet and returns its data
   *   
   */
  async transfer(ethNetwork: string, key: string, secret: string, to: string, amount: string) {
    
     // BITSKI
        // Configure options
    const options = {
      credentials: {
        id: key,
        secret,
      },
      network: ethNetwork,
    };
        // Pass options with the provider
    const provider = Bitski.getProvider(key, options);        
    const web3 = new Web3(provider);
    const web3Accounts: string[] = await web3.eth.getAccounts();
    const rewardsWallet = web3Accounts[0];
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()), config.settings.ethereum.token_address);        
        
    const gasPrice = Number(Number(config.settings.ethereum.gas_price) + 0.01).toFixed(2).toString();
    const sendOptions = { from: rewardsWallet, gas: config.settings.ethereum.transfer_gas, gasPrice: web3.utils.toWei(gasPrice, 'gwei') };
    console.log(`rewardsWallet=${rewardsWallet}, sendOptions=${JSON.stringify(sendOptions)}`);
    await TokenContract.methods.transfer(
          to,
          web3.utils.toWei(amount).toString(),
        ).send(
          { from: rewardsWallet, gas: config.settings.ethereum.transfer_gas, gasPrice: web3.utils.toWei(gasPrice, 'gwei') },
        ).then((receipt) => {
          const txHash = receipt.transactionHash;
          console.log(`Submitted ${txHash} receipt=${JSON.stringify(receipt)}, to:${to}, amount:${amount}`);                    
        }).catch((error) => {
          console.error(`Failed to submit error=${JSON.stringify(error)}, to:${to}, amount:${amount}`);          
        });                          
  }
}  



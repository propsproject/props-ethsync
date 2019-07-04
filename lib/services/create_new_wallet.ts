const { AppLogger } = require('props-lib-logger');
const Wallet = require('ethereumjs-wallet');
// const { Wallet } = require('ethereumjs-wallet');
const Web3 = require('web3');


import config from '../config';

export default class CreateNewWallet {

  web3 = new Web3(config.settings.ethereum.uri);



  /**
   * Generates a new wallet and returns its data
   *   
   */
  async generate() {
    
    const wallet = Wallet.generate();
    return {
      privateKey: wallet.getPrivateKeyString(),
      address: wallet.getAddressString(),
      publicKey: wallet.getPublicKeyString(),
    };    
  }  
}


const Web3 = require('web3');
const { DefenderRelaySigner } = require('defender-relay-client/lib/ethers');
import * as ethers from 'ethers';
import Utils from '../utils/utils';


import config from '../config';

export default class RelayerTransfer {

  web3 = new Web3(config.settings.ethereum.uri);

  /**
   * Transfer props
   *   
   */
  async transferProps(ethNetwork: string, relayerAddress: string, key: string, secret: string, to: string, amount: string) {
        
    const provider = new ethers.providers.JsonRpcProvider(
      config.settings.ethereum.uri,
      ethNetwork,
    );
    const credentials = { apiKey: key, apiSecret: secret };
    const signer = new DefenderRelaySigner(credentials, provider, {
      from: relayerAddress,
      speed: 'fast',
    });
     
    const TokenContractDefender = new ethers.Contract(
      config.settings.ethereum.token_address,
      JSON.parse(Utils.abi()),
      signer,
    );    

    const web3 = new Web3(provider);

    try {
      const res = await TokenContractDefender.transfer(
        to,
        web3.utils.toWei(amount).toString(),
      );
      console.log(JSON.stringify(res));
    } catch (error) {
      throw error;
    }                 
  }
}  



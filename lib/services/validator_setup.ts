const { AppLogger } = require('@younow/lib-logger');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const Web3 = require('web3');


import config from '../config';

export default class ValidatorSetup {
  
  web3 = new Web3(config.settings.ethereum.uri);
  

  
  /**
   * Setup the validator on ethereum props rewards contract
   *
   * @param _name string validator name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setup(_name:string, _rewardsAddress:string, _sidechainAddress:string) {    
    let provider;
    if (config.settings.ethereum.localhost_test_contract.length > 0) {      
      provider = new PrivateKeyProvider(config.settings.ethereum.validator_pk, 'http://localhost:8545');  
    } else {
      provider = new PrivateKeyProvider(config.settings.ethereum.validator_pk, config.settings.ethereum.uri);
    }
    
    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${config.settings.ethereum.validator_pk}`);
    console.log(account.address);
    const TokenContract = new web3.eth.Contract(JSON.parse(this.abi()),config.settings.ethereum.localhost_test_contract.length > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address);
    try {
      
      await TokenContract.methods.updateEntity(1, web3.utils.asciiToHex(_name), _rewardsAddress, _sidechainAddress).send(
        { from: account.address, 
          gas: config.settings.ethereum.entity_setup_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei'),
        }).then((receipt) => {
          console.log(`receipt=${JSON.stringify(receipt)}`);
        }).catch((err) => {
          console.log(`err=${JSON.stringify(err)}`);
          throw err;
        });       
    } catch (error) {
      console.log(`error=${JSON.stringify(error)}`);
      throw error;
    }    
  }

  abi(): string {
    // tslint:disable-next-line:max-line-length
    return '[{"constant":false,"inputs":[{"name":"_controller","type":"address"}],"name":"updateController","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_entityType","type":"uint8"},{"name":"_rewardsDay","type":"uint256"}],"name":"getEntities","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getTransferPreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"transferPreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getIncreaseAllowancePreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"uint8"},{"name":"_value","type":"uint256"},{"name":"_rewardsDay","type":"uint256"}],"name":"updateParameter","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"maxTotalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"canTransferBeforeStartTime","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"uint8"},{"name":"_rewardsDay","type":"uint256"}],"name":"getParameter","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getDecreaseAllowancePreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_rewardsDay","type":"uint256"},{"name":"_rewardsHash","type":"bytes32"},{"name":"_applications","type":"address[]"},{"name":"_amounts","type":"uint256[]"}],"name":"submitDailyRewards","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"approvePreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"rewardsStartTimestamp","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_rewardsDay","type":"uint256"},{"name":"_applications","type":"address[]"}],"name":"setApplications","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getApprovePreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_entityType","type":"uint8"},{"name":"_name","type":"bytes32"},{"name":"_rewardsAddress","type":"address"},{"name":"_sidechainAddress","type":"address"}],"name":"updateEntity","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getTransferFromPreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"transferFromPreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"transfersStartTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_rewardsDay","type":"uint256"},{"name":"_validators","type":"address[]"}],"name":"setValidators","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_controller","type":"address"},{"name":"_minSecondsBetweenDays","type":"uint256"},{"name":"_rewardsStartTimestamp","type":"uint256"}],"name":"initializePostRewardsUpgrade1","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"decreaseAllowancePreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"controller","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"increaseAllowancePreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"rewardsDay","type":"uint256"},{"indexed":true,"name":"rewardsHash","type":"bytes32"},{"indexed":true,"name":"validator","type":"address"}],"name":"DailyRewardsSubmitted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"rewardsDay","type":"uint256"},{"indexed":true,"name":"rewardsHash","type":"bytes32"},{"indexed":false,"name":"numOfApplications","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"DailyRewardsApplicationsMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"rewardsDay","type":"uint256"},{"indexed":true,"name":"rewardsHash","type":"bytes32"},{"indexed":false,"name":"numOfValidators","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"DailyRewardsValidatorsMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"address"},{"indexed":true,"name":"entityType","type":"uint8"},{"indexed":false,"name":"name","type":"bytes32"},{"indexed":false,"name":"rewardsAddress","type":"address"},{"indexed":true,"name":"sidechainAddress","type":"address"}],"name":"EntityUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"uint8"},{"indexed":false,"name":"newValue","type":"uint256"},{"indexed":false,"name":"oldValue","type":"uint256"},{"indexed":false,"name":"rewardsDay","type":"uint256"}],"name":"ParameterUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"validatorsList","type":"address[]"},{"indexed":true,"name":"rewardsDay","type":"uint256"}],"name":"ValidatorsListUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"applicationsList","type":"address[]"},{"indexed":true,"name":"rewardsDay","type":"uint256"}],"name":"ApplicationsListUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"newController","type":"address"}],"name":"ControllerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"delegate","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"TransferPreSigned","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"delegate","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"ApprovalPreSigned","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"decimals","type":"uint8"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_holder","type":"address"},{"name":"_controller","type":"address"},{"name":"_minSecondsBetweenDays","type":"uint256"},{"name":"_rewardsStartTimestamp","type":"uint256"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]';
  }
}


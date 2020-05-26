const { AppLogger } = require('props-lib-logger');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const Web3 = require('web3');


import config from '../config';
import Utils from '../utils/utils';

export default class ApplicationSetup {

  web3 = new Web3(config.settings.ethereum.uri);

  async testSafe() {
    const pk = '34644469282a29bd62387e89f9612e91101db1109d968e4895fb035946d61361';
    const provider = new PrivateKeyProvider(pk,'https://mainnet.infura.io/v3/5573d5f8c3cd4735a59701e97b1f5cd2');
    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
  }

  /**
   * Setup the application on ethereum props rewards contract using Gnosis Safe Wallet
   *
   * @param _pk application's private key
   * @param _multiSigAddress string application name
   * @param _name string application name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setupViaSafe(pk:string, _multiSigAddress:string, _name:string, _rewardsAddress:string, _sidechainAddress:string) {

    let provider;
    if (process.env.ETHEREUM_URL_ETHSYNC.length > 0) {
      config.settings.ethereum.uri = process.env.ETHEREUM_URL_ETHSYNC;
    }
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, 'http://localhost:8545');
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
    let tokenContractAddress = config.settings.ethereum.localhost_test_contract.length 
    > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address;
    if (process.env.PROPS_TOKEN_CONTRACT_ADDRESS.length > 0) {
      tokenContractAddress = process.env.PROPS_TOKEN_CONTRACT_ADDRESS;
    }
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()), tokenContractAddress);

    const multisigWalletABI = require('./GnosisSafe.json');
    const multiSigContractInstance = new web3.eth.Contract(multisigWalletABI.abi, _multiSigAddress);
    const encodedData = await TokenContract.methods.updateEntity(0, web3.utils.asciiToHex(_name), _rewardsAddress, _sidechainAddress,
    ).encodeABI();
    console.log(`config.settings.ethereum.uri=${config.settings.ethereum.uri}`);
    console.log(`tokenContractAddress=${tokenContractAddress}`);
    console.log(`config.settings.ethereum.entity_setup_multisig_gas=${config.settings.ethereum.entity_setup_multisig_gas}`);
    console.log(`this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei')=${this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei')}`);
    try {
      await multiSigContractInstance.methods.execTransaction(
        tokenContractAddress,
        0,
        encodedData,
      ).send(
        { from: account.address,
          gas: config.settings.ethereum.entity_setup_multisig_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei'),
        }).then((receipt) => {
          console.log(`receipt=${JSON.stringify(receipt)}`);
        }).catch((err) => {
          console.log(`err=${JSON.stringify(err)}`);
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup the application on ethereum props rewards contract using Gnosis MultiSig Wallet
   *
   * @param _pk application's private key
   * @param _multiSigAddress string application name
   * @param _name string application name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setupViaMultiSig(pk:string, _multiSigAddress:string, _name:string, _rewardsAddress:string, _sidechainAddress:string) {

    let provider;
    if (process.env.ETHEREUM_URL_ETHSYNC.length > 0) {
      config.settings.ethereum.uri = process.env.ETHEREUM_URL_ETHSYNC;
    }
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, 'http://localhost:8545');
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
    let tokenContractAddress = config.settings.ethereum.localhost_test_contract.length 
    > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address;
    if (process.env.PROPS_TOKEN_CONTRACT_ADDRESS.length > 0) {
      tokenContractAddress = process.env.PROPS_TOKEN_CONTRACT_ADDRESS;
    }
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()), tokenContractAddress);

    const multisigWalletABI = require('./MultiSigWallet.json');
    const multiSigContractInstance = new web3.eth.Contract(multisigWalletABI.abi, _multiSigAddress);
    const encodedData = await TokenContract.methods.updateEntity(0, web3.utils.asciiToHex(_name), _rewardsAddress, _sidechainAddress,
    ).encodeABI();
    console.log(`config.settings.ethereum.uri=${config.settings.ethereum.uri}`);
    console.log(`tokenContractAddress=${tokenContractAddress}`);
    console.log(`config.settings.ethereum.entity_setup_multisig_gas=${config.settings.ethereum.entity_setup_multisig_gas}`);
    console.log(`this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei')=${this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei')}`);
    try {
      await multiSigContractInstance.methods.submitTransaction(
        tokenContractAddress,
        0,
        encodedData,
      ).send(
        { from: account.address,
          gas: config.settings.ethereum.entity_setup_multisig_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei'),
        }).then((receipt) => {
          console.log(`receipt=${JSON.stringify(receipt)}`);
        }).catch((err) => {
          console.log(`err=${JSON.stringify(err)}`);
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup the application on ethereum props rewards contract
   *
   * @param _pk application's private key
   * @param _name string application name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setup(pk:string, _name:string, _rewardsAddress:string, _sidechainAddress:string) {

    let provider;
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, 'http://localhost:8545');
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()),config.settings.ethereum.localhost_test_contract.length > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address);
    try {

      await TokenContract.methods.updateEntity(0, web3.utils.asciiToHex(_name), _rewardsAddress, _sidechainAddress).send(
        { from: account.address,
          gas: config.settings.ethereum.entity_setup_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei'),
        }).then((receipt) => {
          console.log(`receipt=${JSON.stringify(receipt)}`);
        }).catch((err) => {
          console.log(`err=${JSON.stringify(err)}`);
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }  
}


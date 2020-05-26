const { AppLogger } = require('props-lib-logger');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const Web3 = require('web3');
const CPK = require('contract-proxy-kit')


import config from '../config';
import Utils from '../utils/utils';
import { ethSign } from '../utils/ethSigner';

export default class ValidatorSetup {

  web3 = new Web3(config.settings.ethereum.uri);

/**
   * Setup the validator on ethereum props rewards contract using Gnosis Safe Wallet
   *
   * @param _pk validator's private key
   * @param _multiSigAddress string application name
   * @param _name string application name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setupViaSafe(pk:string, _multiSigAddress:string, _name:string, _rewardsAddress:string, _sidechainAddress:string) {

    let provider;
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, 'http://localhost:8545');
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log(`account=${account.address}, gas:${config.settings.ethereum.entity_setup_multisig_gas}`);
    const tokenContractAddress = config.settings.ethereum.localhost_test_contract.length 
    > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address;
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()), tokenContractAddress);    
    const multisigWalletABI = require('./GnosisSafe.json');    
    const multiSigContractInstance = new web3.eth.Contract(multisigWalletABI.abi, _multiSigAddress);
    const encodedData = await TokenContract.methods.updateEntity(1, web3.utils.asciiToHex(_name), _rewardsAddress, _sidechainAddress,
    ).encodeABI();
    console.log("name="+web3.utils.asciiToHex(_name));
    process.exit(1);
    const zeroAddress = `0x${'0'.repeat(40)}`;        
    const nonce = await multiSigContractInstance.methods.nonce().call();
    const txHash = await multiSigContractInstance.methods.getTransactionHash(tokenContractAddress, 0, encodedData, 0, 0, 0, 0, zeroAddress, zeroAddress, nonce).call();
    //const sigs = await web3.eth.sign(txHash, account.address);    
    //const modifiedSigs = sigs.slice(0, -2) + (sigs.slice(-2) === "00" ? "1f" : "20");
    // const signature = await web3.eth.accounts.sign(txHash, pk);
    // console.log(JSON.stringify(sigs));
    // console.log(`modifiedSigs=${modifiedSigs}`);
    
    //process.exit(1);
    // const signature =  "0x" + "0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000001";//web3.eth.abi.encode(account.address) + web3.eth.abi.abi.encode(0) + '01';
    console.log(`nonce=${nonce},txHash=${txHash}`);
    
    
    // let ethSign = async function(act, hash) {
    //   await web3.eth.accounts.sign([act, hash], pk);
    //   // return new Promise(function (resolve, reject) {
    //   //     web3.currentProvider.send({
    //   //         jsonrpc: "2.0", 
    //   //         method: "eth_sign",
    //   //         params: [act, txHash],
    //   //         id: new Date().getTime(),
    //   //         from: account.address,
    //   //     }, function(err, response) {
    //   //         if (err) { 
    //   //             return reject(err);
    //   //         }
    //   //         resolve(response.result);
    //   //     });
    //   // });
    // }
    // const sigs = `0x000000000000000000000000${account.address.replace(
    //   '0x',
    //   '',
    // )}000000000000000000000000000000000000000000000000000000000000000001`;
    // const eth_sign_sig = sigs; //"0x00000000000000000000000089CBe919EE7897c5f75a6d81A576469170B93395000000000000000000000000000000000000000000000000000000000000000001";
    // const eth_sign_sig = signature; //await ethSign(web3, txHash, account.address);
    // const eth_sign_sig = (await web3.eth.accounts.sign(txHash, pk)).signature;
    

    // signatureBytes += (await web3.eth.accounts.sign(txHash, pk)).signature;
    // signatureBytes += 4;
  //   for (let i=0; i<owners.length; i++) {
  //     // Adjust v (it is + 27 => EIP-155 and + 4 to differentiate them from typed data signatures in the Safe)
  //     const sig = await web3.eth.accounts.sign([owners[i], txHash], pk);
  //     // console.log(JSON.stringify(sig));
  //     let signature = String(sig.messageHash).replace('0x', '').replace(/00$/,"1f").replace(/01$/,"20");
  //     signatureBytes += (signature);
  // }
  // console.log(`signatureBytes=${signatureBytes}`);
    // console.log(`eth_sign_sig=${eth_sign_sig}`);
    
    

    try {
      await multiSigContractInstance.methods.approveHash(
        txHash,
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
  //   // process.exit(1);
  //   try {
  //     await multiSigContractInstance.methods.execTransaction(
  //       tokenContractAddress,
  //       0,
  //       encodedData,
  //       0,
  //       0,
  //       0,
  //       0,
  //       zeroAddress,
  //       zeroAddress,
  //       modifiedSigs,
  //     ).send(
  //       { from: account.address,
  //         gas: config.settings.ethereum.entity_setup_multisig_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei'),
  //       }).then((receipt) => {
  //         console.log(`receipt=${JSON.stringify(receipt)}`);
  //       }).catch((err) => {
  //         console.log(`err=${JSON.stringify(err)}`);
  //         throw err;
  //       });
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  /**
   * Setup the validator on ethereum props rewards contract using Gnosis MultiSig Wallet
   *
   * @param _pk validator's private key
   * @param _multiSigAddress string application name
   * @param _name string application name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setupViaMultiSig(pk:string, _multiSigAddress:string, _name:string, _rewardsAddress:string, _sidechainAddress:string) {

    let provider;
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, 'http://localhost:8545');
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
    const tokenContractAddress = config.settings.ethereum.localhost_test_contract.length 
    > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address;
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()), tokenContractAddress);    
    const multisigWalletABI = require('./MultiSigWallet.json');    
    const multiSigContractInstance = new web3.eth.Contract(multisigWalletABI.abi, _multiSigAddress);
    const encodedData = await TokenContract.methods.updateEntity(1, web3.utils.asciiToHex(_name), _rewardsAddress, _sidechainAddress,
    ).encodeABI();

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
    const TokenContract = new web3.eth.Contract(JSON.parse(Utils.abi()),config.settings.ethereum.localhost_test_contract.length > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address);
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
}


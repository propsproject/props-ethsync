import axios from "axios";
const { DefenderRelaySigner } = require("defender-relay-client/lib/ethers");
import * as ethers from "ethers";
const PrivateKeyProvider = require("truffle-privatekey-provider");
const Web3 = require("web3");

import config from "../config";
import Utils from "../utils/utils";

export default class ApplicationSetup {
  private web3 = new Web3(config.settings.ethereum.uri);

  /**
   * Setup the application on ethereum props rewards contract using Gnosis MultiSig Wallet
   *
   * @param _pk application's private key
   * @param _multiSigAddress string application name
   * @param _name string application name
   * @param _rewardsAddress string rewards wallet address
   * @param _sidechainAddress string sidechain wallet address
   */
  async setupViaMultiSig(
    pk: string,
    _multiSigAddress: string,
    _name: string,
    _rewardsAddress: string,
    _sidechainAddress: string
  ) {
    let provider;
    if (process.env.ETHEREUM_URL_ETHSYNC.length > 0) {
      config.settings.ethereum.uri = process.env.ETHEREUM_URL_ETHSYNC;
    }
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, "http://localhost:8545");
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
    let tokenContractAddress =
      config.settings.ethereum.localhost_test_contract.length > 0
        ? config.settings.ethereum.localhost_test_contract
        : config.settings.ethereum.token_address;
    if (process.env.PROPS_TOKEN_CONTRACT_ADDRESS.length > 0) {
      tokenContractAddress = process.env.PROPS_TOKEN_CONTRACT_ADDRESS;
    }
    const TokenContract = new web3.eth.Contract(
      JSON.parse(Utils.abi()),
      tokenContractAddress
    );

    const multisigWalletABI = require("./MultiSigWallet.json");
    const multiSigContractInstance = new web3.eth.Contract(
      multisigWalletABI.abi,
      _multiSigAddress
    );
    const encodedData = await TokenContract.methods
      .updateEntity(
        0,
        web3.utils.asciiToHex(_name),
        _rewardsAddress,
        _sidechainAddress
      )
      .encodeABI();
    console.log(`config.settings.ethereum.uri=${config.settings.ethereum.uri}`);
    console.log(`tokenContractAddress=${tokenContractAddress}`);
    console.log(
      `config.settings.ethereum.entity_setup_multisig_gas=${config.settings.ethereum.entity_setup_multisig_gas}`
    );
    console.log(
      `this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei')=${this.web3.utils.toWei(
        config.settings.ethereum.gas_price,
        "gwei"
      )}`
    );
    try {
      await multiSigContractInstance.methods
        .submitTransaction(tokenContractAddress, 0, encodedData)
        .send({
          from: account.address,
          gas: config.settings.ethereum.entity_setup_multisig_gas,
          gasPrice: this.web3.utils.toWei(
            config.settings.ethereum.gas_price,
            "gwei"
          ),
        })
        .then((receipt) => {
          console.log(`receipt=${JSON.stringify(receipt)}`);
        })
        .catch((err) => {
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
  async setup(
    pk: string,
    _name: string,
    _rewardsAddress: string,
    _sidechainAddress: string
  ) {
    let provider;
    if (config.settings.ethereum.localhost_test_contract.length > 0) {
      provider = new PrivateKeyProvider(pk, "http://localhost:8545");
    } else {
      provider = new PrivateKeyProvider(pk, config.settings.ethereum.uri);
    }

    const web3 = new Web3(provider);
    const account = web3.eth.accounts.privateKeyToAccount(`0x${pk}`);
    console.log(account.address);
    console.log(
      `config.settings.ethereum.entity_setup_gas=${config.settings.ethereum.entity_setup_gas}, config.settings.ethereum.gas_price=${config.settings.ethereum.gas_price}`
    );
    const TokenContract = new web3.eth.Contract(
      JSON.parse(Utils.abi()),
      config.settings.ethereum.localhost_test_contract.length > 0
        ? config.settings.ethereum.localhost_test_contract
        : config.settings.ethereum.token_address
    );
    try {
      await TokenContract.methods
        .updateEntity(
          0,
          web3.utils.asciiToHex(_name),
          _rewardsAddress,
          _sidechainAddress
        )
        .send({
          from: account.address,
          gas: config.settings.ethereum.entity_setup_gas,
          gasPrice: this.web3.utils.toWei(
            config.settings.ethereum.gas_price,
            "gwei"
          ),
        })
        .then((receipt) => {
          console.log(`receipt=${JSON.stringify(receipt)}`);
        })
        .catch((err) => {
          console.log(`err=${JSON.stringify(err)}`);
          throw err;
        });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup the application on ethereum props rewards contract using defender relayer
   */
  async setupViaDefender(
    clientId: string,
    clientSecret: string,
    submittingWallet: string,
    _name: string,
    _rewardsAddress: string,
    _sidechainAddress: string
  ) {
    const network =
      String(config.settings.ethereum.uri).indexOf("mainnet") >= 0
        ? "mainnet"
        : "rinkeby";
    const provider = new ethers.providers.JsonRpcProvider(
      config.settings.ethereum.uri,
      network
    );
    const credentials = { apiKey: clientId, apiSecret: clientSecret };
    const signer = new DefenderRelaySigner(credentials, provider, {
      from: submittingWallet,
      speed: "fast",
    });
    const contract_address: string =
      config.settings.ethereum.localhost_test_contract.length > 0
        ? config.settings.ethereum.localhost_test_contract
        : config.settings.ethereum.token_address;
    const TokenContractDefender = new ethers.Contract(
      contract_address,
      JSON.parse(Utils.abi()),
      signer
    );
    console.log(
      `network=${network}, contract_address=${contract_address}, _name=${_name}, config.settings.ethereum.entity_setup_gas=${config.settings.ethereum.entity_setup_gas}, config.settings.ethereum.gas_price=${config.settings.ethereum.gas_price}`
    );

    try {
      const res = await TokenContractDefender.updateEntity(
        0,
        ethers.utils.formatBytes32String(_name),
        _rewardsAddress,
        _sidechainAddress,
        {}
      );
      console.log(JSON.stringify(res));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup the application on Ethereum Props rewards contract using Gnosis Safe Wallet
   *
   * @param pk application's private key
   * @param multiSigAddress string multisig address
   * @param appName string application name
   * @param rewardsAddress string rewards wallet address
   * @param sidechainAddress string sidechain wallet address
   */
  async setupViaSafe(
    pk: string,
    multiSigAddress: string,
    appName: string,
    rewardsAddress: string,
    sidechainAddress: string
  ) {
    const wallet = new ethers.Wallet(pk);

    await this._setupViaSafe(
      multiSigAddress,
      wallet,
      appName,
      rewardsAddress,
      sidechainAddress
    );
  }

  /**
   * Setup the application on Ethereum Props rewards contract using Defender relayer
   */
  async setupViaSafeWithDefender(
    clientId: string,
    clientSecret: string,
    multiSigAddress: string,
    appName: string,
    rewardsAddress: string,
    sidechainAddress: string
  ) {
    const network =
      String(config.settings.ethereum.uri).indexOf("mainnet") >= 0
        ? "mainnet"
        : "rinkeby";
    const provider = new ethers.providers.JsonRpcProvider(
      config.settings.ethereum.uri,
      network
    );
    const credentials = { apiKey: clientId, apiSecret: clientSecret };
    const signer = new DefenderRelaySigner(credentials, provider);

    await this._setupViaSafe(
      multiSigAddress,
      signer,
      appName,
      rewardsAddress,
      sidechainAddress
    );
  }

  private async _setupViaSafe(
    safeAddress: string,
    signer: ethers.Signer,
    appName: string,
    rewardsAddress: string,
    sidechainAddress: string
  ) {
    const network =
      String(config.settings.ethereum.uri).indexOf("mainnet") >= 0
        ? "mainnet"
        : "rinkeby";
    const provider = new ethers.providers.JsonRpcProvider(
      config.settings.ethereum.uri,
      network
    );

    const safeTransactionServicebaseUrl =
      network == "mainnet"
        ? "https://safe-transaction.gnosis.io/api/v1"
        : "https://safe-transaction.rinkeby.gnosis.io/api/v1";

    const safe = await axios
      .get(`${safeTransactionServicebaseUrl}/safes/${safeAddress}`)
      .then((response) => response.data);

    const propsTokenAddress: string =
      config.settings.ethereum.localhost_test_contract.length > 0
        ? config.settings.ethereum.localhost_test_contract
        : config.settings.ethereum.token_address;
    const propsToken = new ethers.Contract(
      propsTokenAddress,
      JSON.parse(Utils.abi())
    );

    const calldata = propsToken.interface.encodeFunctionData("updateEntity", [
      0,
      ethers.utils.formatBytes32String(appName),
      rewardsAddress,
      sidechainAddress,
    ]);

    const multisig = new ethers.Contract(
      safeAddress,
      require("./GnosisSafe.json").abi,
      provider
    );

    const txHash = await multisig.getTransactionHash(
      ethers.utils.getAddress(propsTokenAddress),
      0,
      calldata,
      0,
      0,
      0,
      0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      safe.nonce
    );

    const signature = await signer.signMessage(
      // It's important to arrayify and not sign the string directly
      ethers.utils.arrayify(txHash)
    );
    // In order for Gnosis Safe to recognize this as an eth_sign signature,
    // we must tweak it so that v > 30 (via v = v + 4)
    let gnosisEthSignSignature = ethers.BigNumber.from(signature)
      .add(4)
      .toHexString();

    const tx = {
      to: ethers.utils.getAddress(propsTokenAddress),
      value: 0,
      data: calldata,
      operation: 0,
      gasToken: "0x0000000000000000000000000000000000000000",
      safeTxGas: 0,
      baseGas: 0,
      gasPrice: 0,
      refundReceiver: "0x0000000000000000000000000000000000000000",
      nonce: safe.nonce,
      contractTransactionHash: txHash,
      sender: ethers.utils.getAddress(await signer.getAddress()),
      signature: gnosisEthSignSignature,
      origin: null,
    };

    await axios.post(
      `${safeTransactionServicebaseUrl}/safes/${safeAddress}/multisig-transactions/`,
      tx
    );
  }
}

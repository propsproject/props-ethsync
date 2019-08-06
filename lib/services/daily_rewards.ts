import BigNumber from 'bignumber.js';
import { TransactionManager } from 'propskit';
const { AppLogger } = require('props-lib-logger');
const PrivateKeyProvider = require('truffle-privatekey-provider');
const Web3 = require('web3');
const { soliditySha3 } = require('web3-utils');
BigNumber.set({ EXPONENTIAL_AT: 1e+9 });

import config from '../config';
import Utils from '../utils/utils';

interface RewardsDayTimeData {
  rewardsStartTimestamp:number;
  timestampOnEthereum:number;
  blockNumberOnEthereum:number;
  secondsInDay:number;
  rewardsDay:number;
  contractAddress:string;
  previousDayRewardsDayTimestamp:number;
}

interface RewardsContractData {
  applications:string[];
  validators:string[];
  maxTotalSupply:BigNumber;
  totalSupply:BigNumber;
  applicationRewardsPphm:BigNumber;
  applicationRewardsMaxVariationPphm:BigNumber;
}

export default class DailyRewards {

  web3 = new Web3(config.settings.ethereum.uri);
  tokenContract: any;
  tm: TransactionManager;
  rewardsDayData: RewardsDayTimeData;
  rewardsContractData: RewardsContractData;
  activeApplications: string[];
  currentValidatorAddress: string;
  currentValidatorPK: string;
  contractAddress: string;

  async calculateAndSubmit() {
    try {
      // instantiate transaction manager for sidechain transactions
      this.tm = config.settings.sawtooth.transaction_manager();
      // setup web3 provider with private key
      let provider;
      this.currentValidatorPK = config.settings.ethereum.validator_pk;
      console.log(`config.settings.ethereum.localhost_test_contract=${config.settings.ethereum.localhost_test_contract}, length=${config.settings.ethereum.localhost_test_contract.length}`);
      if (config.settings.ethereum.localhost_test_contract.length > 0) {
        provider = new PrivateKeyProvider(this.currentValidatorPK, 'http://localhost:8545');
      } else {
        provider = new PrivateKeyProvider(this.currentValidatorPK, config.settings.ethereum.uri);
      }

      this.web3 = new Web3(provider);
      this.contractAddress =  config.settings.ethereum.localhost_test_contract.length > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address;
      this.tokenContract = new this.web3.eth.Contract(JSON.parse(Utils.abi()), this.contractAddress);
      if (this.currentValidatorPK.length === 0) {
        throw new Error('Missing validator private key');
      }
      
      const currentAccount: any = this.web3.eth.accounts.privateKeyToAccount(`0x${this.currentValidatorPK}`);
      this.currentValidatorAddress = currentAccount.address;
      try {
        const ethBalance:BigNumber = new BigNumber(this.web3.utils.fromWei(await this.web3.eth.getBalance(this.currentValidatorAddress)));
        AppLogger.log(`Wallet ${this.currentValidatorAddress} has ${ethBalance.toString()} ETH`, 'DAILY_SUMMARY_VALIDATOR_BALANCE', 'jon', 1, 0, 0, { amount: Number(ethBalance.toString()) });
      } catch (error) {
        AppLogger.log(`Failed to get Wallet ${this.currentValidatorAddress} balance ${JSON.stringify(error)}`, 'DAILY_SUMMARY_VALIDATOR_BALANCE_ERROR', 'jon', 1, 0, 0);
      }

      await this.calcRewardsDayData();
      const totalSupplyBlockToUse:number = await this.getBlockNumberOfPreviousRewardsDay();            
      await this.getRewardsContractData(totalSupplyBlockToUse);      

      // check if i am an active validator that should submit
      if (this.rewardsContractData.validators.indexOf(this.currentValidatorAddress) > -1) {
        // check how many applications are participating - if 1 give it all the daily reward, otherwise get activity and props for all users to calculate per algorithm
        if (this.rewardsContractData.applications.length === 1) {
          const dailyRewardAmount:string = this.rewardsContractData.maxTotalSupply
            .minus(this.rewardsContractData.totalSupply)
            .times(this.rewardsContractData.applicationRewardsPphm)
            .div(1e8)
            .integerValue(BigNumber.ROUND_DOWN).toString();
          const rewardsHash = soliditySha3(
            this.rewardsDayData.rewardsDay,
            this.rewardsContractData.applications.length, // == 1
            1, // only 1 app
            this.formatArrayForSha3(this.rewardsContractData.applications, 'address'),
            this.formatArrayForSha3([dailyRewardAmount], 'uint256'),
          );
          const submittedData:any = {
            txHash: '',
            receipt: '',
            error: '',
            submittingValidator: this.currentValidatorAddress,
            rewardsDay: this.rewardsDayData.rewardsDay,
            rewardsHash,
            applications: this.rewardsContractData.applications,
            amounts: [dailyRewardAmount],
          };
          AppLogger.log(`Will Submit ${JSON.stringify(submittedData)}`, 'DAILY_SUMMARY_CALCULATE_SUBMISSION', 'jon', 1, 0, 0);

          await this.tokenContract.methods.submitDailyRewards(
            this.rewardsDayData.rewardsDay,
            rewardsHash,
            this.rewardsContractData.applications,
            [dailyRewardAmount],
          ).send(
            { from: this.currentValidatorAddress, gas: config.settings.ethereum.submit_rewards_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei') },
          ).then((receipt) => {
            submittedData.txHash = receipt.transactionHash;
            submittedData.receipt = receipt;
            AppLogger.log(`Submitted ${JSON.stringify(submittedData)} receipt=${JSON.stringify(receipt)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_SUCCESS', 'jon', 1, 0, 0);
          }).catch((error) => {
            submittedData.error = error;
            AppLogger.log(`Failed to submit ${JSON.stringify(submittedData)} error=${JSON.stringify(error)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_FAIL', 'jon', 1, 0, 0);
            throw new Error(error);
          });
        } else {
          // 1. get application users with acitivty for rewards day for all active apps
          // 2. check each application users balance object if timestamp calculation yields change in next rewards day use the preCutoffBalance object
          // 3. calculate per algorithm amounts per the active apps
          // 4. submit
        }
      } else {
        const msg:string = `This validator ${this.currentValidatorAddress} is not on the list (${JSON.stringify(this.rewardsContractData.validators)}) thus should not submit`;
        AppLogger.log(msg, 'DAILY_SUMMARY_CALCULATE_DONE', 'jon', 1, 0, 0);
        throw new Error(msg);
      }

    } catch (error) {
      AppLogger.log(`${error}`, 'DAILY_SUMMARY_CALCULATE_ERROR', 'jon', 1, 0, 0);
      throw error;
    }
  }

  async getBlockNumberOfPreviousRewardsDay(): Promise<number> {
    try {
      const currentEthBlockNumber:number = this.rewardsDayData.blockNumberOnEthereum;
      const currentEthTimestamp:number = this.rewardsDayData.timestampOnEthereum;
      const previousDayRewardsDayTimestampPlusBuffer = this.rewardsDayData.previousDayRewardsDayTimestamp + (15 * 60); // 15 minute buffer
      let guestimateBlockNumber = currentEthBlockNumber - Math.floor((currentEthTimestamp - previousDayRewardsDayTimestampPlusBuffer) / config.settings.ethereum.avg_block_time);
      // tslint:disable-next-line:max-line-length
      // console.log(`currentEthBlockNumber=${currentEthBlockNumber}, currentEthTimestamp=${currentEthTimestamp}, previousDayRewardsDayTimestampPlusBuffer=${previousDayRewardsDayTimestampPlusBuffer},avg_block_time=${config.settings.ethereum.avg_block_time},guestimateBlockNumber=${guestimateBlockNumber}`);      
      let guestimateBlockData:any = await this.web3.eth.getBlock(guestimateBlockNumber);      
      let minDif = 99999999;
      let chosenBlock = -1;
      let currentDif = guestimateBlockData.timestamp - this.rewardsDayData.previousDayRewardsDayTimestamp;
      let requestsCount = 0;
      // console.log(`guestimateBlockData.timestamp=${guestimateBlockData.timestamp}, guestimateBlockNumber=${guestimateBlockNumber}, minDif=${minDif}, currentDif=${currentDif}, requestsCount=${requestsCount}`);
      while(Math.abs(currentDif) < minDif) {
        const previousMinDif = minDif;
        minDif = Math.abs(currentDif);
        if (minDif < previousMinDif) {
          chosenBlock = guestimateBlockNumber;
        }
        if (currentDif > 0) {
          guestimateBlockNumber -= 1;
        } else {
          guestimateBlockNumber += 1;
        }
        guestimateBlockData = await this.web3.eth.getBlock(guestimateBlockNumber);
        requestsCount += 1;
        currentDif = guestimateBlockData.timestamp - previousDayRewardsDayTimestampPlusBuffer;        
        // console.log(`guestimateBlockData.timestamp=${guestimateBlockData.timestamp}, guestimateBlockNumber=${guestimateBlockNumber}, minDif=${minDif}, currentDif=${currentDif}, requestsCount=${requestsCount}, chosenBlock=${chosenBlock}`);
      }      
      // console.log(chosenBlock);
      return chosenBlock;
    } catch (error) {
      AppLogger.log(`${error}`, 'DAILY_SUMMARY_GET_BLOCK_NUMBER_ERROR', 'jon', 1, 0, 0);
      throw error;
    }
  }

  async getRewardsContractData(totalSupplyBlock:number): Promise<boolean> {
    const applications:string[] = await this.tokenContract.methods.getEntities(0, this.rewardsDayData.rewardsDay).call();
    const validators:string[] = await this.tokenContract.methods.getEntities(1, this.rewardsDayData.rewardsDay).call();
    const maxTotalSupply:BigNumber = new BigNumber(await this.tokenContract.methods.maxTotalSupply().call());
    const totalSupply:BigNumber = new BigNumber(await this.tokenContract.methods.totalSupply().call(undefined, totalSupplyBlock));    
    const applicationRewardsPphm:BigNumber = new BigNumber(await this.tokenContract.methods.getParameter(0, this.rewardsDayData.rewardsDay).call());
    const applicationRewardsMaxVariationPphm:BigNumber = new BigNumber(await this.tokenContract.methods.getParameter(1, this.rewardsDayData.rewardsDay).call());    
    this.rewardsContractData = {
      applications,
      validators,
      maxTotalSupply,
      totalSupply,
      applicationRewardsPphm,
      applicationRewardsMaxVariationPphm,
    };
    AppLogger.log(`Getting rewards contract data, totalSupplyBlock=${totalSupplyBlock} ${JSON.stringify(this.rewardsContractData)}`, 'DAILY_SUMMARY_GET_REWARDS_CONTRACT_DATA', 'jon', 1, 0, 0);
    if (!(applications.length > 0 && validators.length > 0 && maxTotalSupply.isPositive() && totalSupply.isPositive() && applicationRewardsPphm.isPositive() && applicationRewardsMaxVariationPphm.isPositive()))
      throw new Error(`Could not get valid rewards contract data ${JSON.stringify(this.rewardsContractData)}`);
    return true;
  }

  async calcRewardsDayData(): Promise<boolean> {
    const rewardsStartTimestamp:number = await this.tokenContract.methods.rewardsStartTimestamp().call();
    const lastBlockOnEtheruem:any = await this.web3.eth.getBlock('latest');
    const timestampOnEthereum:number = lastBlockOnEtheruem.timestamp;
    const secondsInDay:number = parseInt(config.settings.ethereum.seconds_in_day, 10);
    const rewardsDay:number = Math.floor((timestampOnEthereum - rewardsStartTimestamp) / secondsInDay); // no +1 getting for yesterday;
    const previousDayRewardsDayTimestamp:number = Number(rewardsStartTimestamp) + ((Number(rewardsDay) - 1) * Number(secondsInDay));
    this.rewardsDayData = {
      rewardsStartTimestamp,
      timestampOnEthereum,
      blockNumberOnEthereum: lastBlockOnEtheruem.number,
      secondsInDay,
      rewardsDay,
      previousDayRewardsDayTimestamp,
      contractAddress: this.contractAddress,
    };
    AppLogger.log(`Getting rewards day data ${JSON.stringify(this.rewardsDayData)}`, 'DAILY_SUMMARY_GET_REWARDS_DAY', 'jon', 1, 0, 0);
    if (!(rewardsStartTimestamp > 0 && timestampOnEthereum > 0 && secondsInDay > 0 && rewardsDay > 0))
      throw new Error(`Could not get valid rewards day data ${JSON.stringify(this.rewardsDayData)}`);
    return true;
  }

  formatArrayForSha3(arr, type): any {
    return { type, value: arr };
  }  
}


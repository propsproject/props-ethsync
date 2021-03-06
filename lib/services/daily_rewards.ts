import Decimal from 'decimal.js';
const { AppLogger } = require('props-lib-logger');
const Web3 = require('web3');
const { soliditySha3 } = require('web3-utils');
Decimal.set({ toExpPos: 9e15 });
import rp = require('request-promise-native');

import config from '../config';
import Utils from '../utils/utils';
import { AppRewardsCalcuator } from '../rewards/app_rewards_calculator';

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
  maxTotalSupply:Decimal;
  totalSupply:Decimal;
  applicationRewardsPphm:Decimal;
  applicationRewardsMaxVariationPphm:Decimal;
}

export default class DailyRewards {

  web3 = new Web3(config.settings.ethereum.uri);
  tokenContract: any;  
  rewardsDayData: RewardsDayTimeData;
  rewardsContractData: RewardsContractData;
  activeApplications: string[];
  currentValidatorAddress: string;
  currentValidatorPK: string;
  contractAddress: string;
  retryNumber: number;
  submittedData: any;
  nonce: any;

  sleep(sec): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(resolve, sec * 1000, true);
    });
  }

  submitTransaction(rewardsHash: string, activeApplications:string[], amounts: string[], gasPrice: string) {
    this.tokenContract.methods.submitDailyRewards(
      this.rewardsDayData.rewardsDay,
      rewardsHash,
      activeApplications,
      amounts,
    ).send(
      { from: this.currentValidatorAddress, gas: config.settings.ethereum.submit_rewards_gas, gasPrice: this.web3.utils.toWei(gasPrice, 'gwei'), nonce: this.nonce},
    ).on('transactionHash', (hash) => { 
      this.submittedData.txHash = hash;
      AppLogger.log(`Submitted ${JSON.stringify(this.submittedData)} txHash=${JSON.stringify(hash)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_ON_TXHASH', 'jon', 1, 0, 0);
    }).then((receipt) => {
      this.submittedData.txHash = receipt.transactionHash;
      this.submittedData.receipt = receipt;
      AppLogger.log(`Receipt received for ${receipt.transactionHash} receipt=${JSON.stringify(receipt)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_SUCCESS', 'jon', 1, 0, 0);
      console.log(`Calculated and submitted rewards succesfully`);
      process.exit(0);          
    }).catch((error) => {
      this.submittedData.error = error;
      if (String(error).toLowerCase().indexOf('nonce') >= 0) {
        AppLogger.log(`Nonce was already processed we are done msg=${String(error)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_SUCCESS_DURING_TIMEOUT', 'jon', 1, 0, 0);
        console.log(`Calculated and submitted rewards succesfully`);
        process.exit(0);  
      }      
    });      
  }

  async calculateAndSubmit() {
    try {
      AppLogger.log(`calculateAndSubmit version notes: using state-api to get rewards data`, 'SUBMIT_REWARDS', 'jon', 1, 0, 0);
      this.retryNumber = 0;
      // setup web3 provider with private key      
      this.currentValidatorPK = config.settings.ethereum.validator_pk;      
      this.web3 = new Web3(new Web3.providers.HttpProvider(config.settings.ethereum.uri));      
      const currentAccount = this.web3.eth.accounts.privateKeyToAccount(`0x${this.currentValidatorPK}`);      
      this.web3.eth.accounts.wallet.add(currentAccount);
      this.web3.eth.defaultAccount = currentAccount.address;
      this.contractAddress =  config.settings.ethereum.localhost_test_contract.length > 0 ? config.settings.ethereum.localhost_test_contract : config.settings.ethereum.token_address;
      this.tokenContract = new this.web3.eth.Contract(JSON.parse(Utils.abi()), this.contractAddress);
      if (this.currentValidatorPK.length === 0) {
        throw new Error('Missing validator private key');
      }            
      this.currentValidatorAddress = currentAccount.address;
      try {
        const ethBalance:Decimal = new Decimal(this.web3.utils.fromWei(await this.web3.eth.getBalance(this.currentValidatorAddress)));
        
        this.nonce = await this.web3.eth.getTransactionCount(this.currentValidatorAddress);
        AppLogger.log(`Wallet ${this.currentValidatorAddress} has ${ethBalance.toString()} ETH and nonce=${this.nonce}`, 'DAILY_SUMMARY_VALIDATOR_BALANCE', 'jon', 1, 0, 0, { amount: Number(ethBalance.toString()) });
      } catch (error) {
        AppLogger.log(`Failed to get Wallet ${this.currentValidatorAddress} balance ${JSON.stringify(error)}`, 'DAILY_SUMMARY_VALIDATOR_BALANCE_ERROR', 'jon', 1, 0, 0);
        throw new Error(`Failed to get Wallet ${this.currentValidatorAddress} balance ${JSON.stringify(error)}`);
      }      
      await this.calcRewardsDayData();      
      await this.getRewardsContractData();      

      // check if i am an active validator that should submit
      if (this.rewardsContractData.validators.indexOf(this.currentValidatorAddress) > -1) {
        // check how many applications are participating - if 1 give it all the daily reward, otherwise get activity and props for all users to calculate per algorithm
        const appRewardsCalc: AppRewardsCalcuator = new AppRewardsCalcuator();        

        // get activity summary data from props-state sidechain cache
        const url = `${config.settings.activity.state_rest_uri}`;
        AppLogger.log(`Fetching results from ${url} for rewardsDay=${this.rewardsDayData.rewardsDay}`, 'DAILY_SUMMARY_FETCH_APPS_ACTIVITY', 'jon', 0, 0, 0, {}, {});

        const options = {
          url,
          json: true,
          method: 'POST',
          body: {
            rewards_day: this.rewardsDayData.rewardsDay,
            applications: this.rewardsContractData.applications,
          },
        };

        const res = await rp(options);
        if (Number(res['statusCode']) !== 200) {
          AppLogger.log(`Failed to get results from ${url} for rewardsDay=${this.rewardsDayData.rewardsDay} ${JSON.stringify(res)}`, 'DAILY_SUMMARY_FETCH_APPS_ACTIVITY_ERROR', 'jon', 0, 0, 0, {}, {});
          throw new Error(`Failed to get results from ${url} for rewardsDay=${this.rewardsDayData.rewardsDay} ${JSON.stringify(res)}`);
        }
        AppLogger.log(`Got the following results from ${url} for rewardsDay=${this.rewardsDayData.rewardsDay} ${JSON.stringify(res)}`, 'DAILY_SUMMARY_FETCH_APPS_ACTIVITY_SUCCESS', 'jon', 0, 0, 0, {}, {});
        this.rewardsContractData.totalSupply = new Decimal(res['payload']['data']['totalSupply']);
        const dailyRewardAmount:string = this.rewardsContractData.maxTotalSupply
            .minus(this.rewardsContractData.totalSupply)
            .times(this.rewardsContractData.applicationRewardsPphm)
            .div(1e8)
            .floor().toString();         
        appRewardsCalc.calcRewards(new Decimal(dailyRewardAmount), res['payload']['data']);
        const applications: string[] = this.rewardsContractData.applications;
        const amounts: string[] = [];// = appRewardsCalc.appRewards;[dailyRewardAmount]; // BigNumber
        const activeApplications: string[] = [];
        for (let i:number = 0; i < applications.length; i += 1) {          
          if (applications[i].toLowerCase() in appRewardsCalc.appRewards) {
            if (appRewardsCalc.appRewards[applications[i].toLowerCase()].greaterThan(0)) {
              activeApplications.push(applications[i]);
              amounts.push(appRewardsCalc.appRewards[applications[i].toLowerCase()].toString());
            }
          }
        }
                
        if (activeApplications.length === 0) {
          const msg:string = `No activity for any application - should not submit`;
          AppLogger.log(msg, 'DAILY_SUMMARY_CALCULATE_DONE', 'jon', 1, 0, 0);
          throw new Error(msg);
        }
        AppLogger.log(`applications=${JSON.stringify(activeApplications)}, amounts=${JSON.stringify(amounts)}, dailyRewardsAmount=${dailyRewardAmount}`, 'DAILY_SUMMARY_APPS_REWARDS');
        const rewardsHash = soliditySha3(
          this.rewardsDayData.rewardsDay,
          activeApplications.length,
          amounts.length,
          this.formatArrayForSha3(activeApplications, 'address'),
          this.formatArrayForSha3(amounts, 'uint256'),
        );
        this.submittedData = {
          txHash: '',
          receipt: '',
          error: '',
          submittingValidator: this.currentValidatorAddress,
          rewardsDay: this.rewardsDayData.rewardsDay,
          rewardsHash,
          activeApplications,
          amounts,
        };
        
        const maxRetries = Number(config.settings.ethereum.submit_rewards_retry_max);        
        
        let baseGasPrice = Number(config.settings.ethereum.gas_price);
        if (process.env.NODE_ENV === 'production') {
          const gasOracleUrl:String = 'https://api.etherscan.io/api?module=gastracker&action=gasoracle';        
          try {
            
            const gasOptions = {
              url: gasOracleUrl,
              json: true,
              method: 'GET',
            };
            let retries: number = 0;
            let hasGasPrice:boolean = false;
            let gasRes;
            const sleepMS = (milliseconds) => {
              return new Promise(resolve => setTimeout(resolve, milliseconds));
            };
            while (!hasGasPrice && retries < 5) {
              gasRes = await rp(gasOptions);
              AppLogger.log(`Query for gas price from ${gasOracleUrl} (retry=${retries})=> gasPrice=min(${gasRes['result']['SafeGasPrice']},1500) from: ${JSON.stringify(gasRes)}`, 'DAILY_SUMMARY_GET_SUGGESTED_GAS_PRICE', 'jon', 1, 0, 0);
              if (Number(gasRes['status']) === 1) {
                hasGasPrice = true;
                baseGasPrice = Math.min(Number(gasRes['result']['SafeGasPrice']), 1500);
              } else {
                await sleepMS(1000 * (retries + 1));
              }
              retries += 1;
            }                        
          } catch (error) {
            AppLogger.log(`Query for gas price from ${gasOracleUrl} failed => ${JSON.stringify(error)}`, 'DAILY_SUMMARY_GET_SUGGESTED_GAS_PRICE_FAILED', 'jon', 1, 0, 0);
          }
        } else {
          AppLogger.log(`Overriding gasPrice with default ${baseGasPrice} - oracle gas price is for production only`, 'DAILY_SUMMARY_GET_SUGGESTED_GAS_PRICE_DEFAULT', 'jon', 1, 0, 0);
        }
        
        do {
          const gasPrice = Number(Number(baseGasPrice) + (this.retryNumber * Number(config.settings.ethereum.submit_rewards_retry_gas_increase))).toFixed(2).toString();
          AppLogger.log(`Will Submit ${JSON.stringify(this.submittedData)} with gasPrice=${gasPrice} and nonce=${this.nonce} and this.retryNumber=${this.retryNumber}`, 'DAILY_SUMMARY_CALCULATE_SUBMISSION', 'jon', 1, 0, 0);
          this.retryNumber += 1;
          try {
            this.submitTransaction(rewardsHash, activeApplications, amounts, gasPrice);
            await this.sleep(Number(config.settings.ethereum.submit_rewards_retry_time));
            
            // if (submitRes) {
            //   AppLogger.log(`Submitted Succesfully - finish script here...`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_SUCCESS', 'jon', 1, 0, 0);
            //   return true;
            // }
          } catch (error) {            
            AppLogger.log(`Failed to submit ${JSON.stringify(this.submittedData)} error=${JSON.stringify(error)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_FAIL', 'jon', 1, 0, 0);                          
          }
        } while (this.retryNumber < maxRetries);
        const maxRetryMsg = `All retries ${maxRetries} did not succeed within 1 minute. Notice that last transaction may still be mined`;
        AppLogger.log(`${maxRetryMsg}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_FAIL', 'jon', 1, 0, 0);
        throw new Error(maxRetryMsg);
        // await this.tokenContract.methods.submitDailyRewards(
        //   this.rewardsDayData.rewardsDay,
        //   rewardsHash,
        //   activeApplications,
        //   amounts,
        // ).send(
        //   { from: this.currentValidatorAddress, gas: config.settings.ethereum.submit_rewards_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei') },
        // ).on('transactionHash', (hash) => { 
        //   this.submittedData.txHash = hash;
        //   AppLogger.log(`Submitted ${JSON.stringify(this.submittedData)} txHash=${JSON.stringify(hash)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_ON_TXHASH', 'jon', 1, 0, 0);
        // }).then((receipt) => {
        //   this.submittedData.txHash = receipt.transactionHash;
        //   this.submittedData.receipt = receipt;
        //   AppLogger.log(`Submitted ${JSON.stringify(this.submittedData)} receipt=${JSON.stringify(receipt)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_SUCCESS', 'jon', 1, 0, 0);
        // }).catch((error) => {
        //   this.submittedData.error = error;
        //   AppLogger.log(`Failed to submit ${JSON.stringify(this.submittedData)} error=${JSON.stringify(error)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_FAIL', 'jon', 1, 0, 0);
        //   throw new Error(error);
        // });  
        
        // await this.tokenContract.methods.submitDailyRewards(
        //   this.rewardsDayData.rewardsDay,
        //   rewardsHash,
        //   activeApplications,
        //   amounts,
        // ).send(
        //   { from: this.currentValidatorAddress, gas: config.settings.ethereum.submit_rewards_gas, gasPrice: this.web3.utils.toWei(config.settings.ethereum.gas_price, 'gwei') },
        // ).then((receipt) => {
        //   submittedData.txHash = receipt.transactionHash;
        //   submittedData.receipt = receipt;
        //   AppLogger.log(`Submitted ${JSON.stringify(submittedData)} receipt=${JSON.stringify(receipt)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_SUCCESS', 'jon', 1, 0, 0);
        // }).catch((error) => {
        //   submittedData.error = error;
        //   AppLogger.log(`Failed to submit ${JSON.stringify(submittedData)} error=${JSON.stringify(error)}`, 'DAILY_SUMMARY_CALCULATE_SUBMIT_FAIL', 'jon', 1, 0, 0);
        //   throw new Error(error);
        // });        
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

  async getRewardsContractData(): Promise<boolean> {    
    const applications:string[] = await this.tokenContract.methods.getEntities(0, this.rewardsDayData.rewardsDay).call();    
    const validators:string[] = await this.tokenContract.methods.getEntities(1, this.rewardsDayData.rewardsDay).call();
    const maxTotalSupply:Decimal = new Decimal(await this.tokenContract.methods.maxTotalSupply().call());
    const totalSupply:Decimal = new Decimal(0);
    const applicationRewardsPphm:Decimal = new Decimal(await this.tokenContract.methods.getParameter(0, this.rewardsDayData.rewardsDay).call());
    const applicationRewardsMaxVariationPphm:Decimal = new Decimal(await this.tokenContract.methods.getParameter(1, this.rewardsDayData.rewardsDay).call());        
    this.rewardsContractData = {
      applications,
      validators,
      maxTotalSupply,
      totalSupply,
      applicationRewardsPphm,
      applicationRewardsMaxVariationPphm,
    };
    AppLogger.log(`Getting rewards contract data, ${JSON.stringify(this.rewardsContractData)}`, 'DAILY_SUMMARY_GET_REWARDS_CONTRACT_DATA', 'jon', 1, 0, 0);
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


import BigNumber from 'bignumber.js';
import { TransactionManager } from 'propskit';
const { AppLogger } = require('props-lib-logger');
const Web3 = require('web3');

import config from '../config';
import EtherscanApi from './etherscan_api';
import Transaction from '../models/transaction';
import utils from '../utils/utils';

BigNumber.set({ EXPONENTIAL_AT: 1e+9 });

export default class Sync {

  tm: TransactionManager;
  web3 = new Web3(config.settings.ethereum.uri);
  releaseLock: any;

  async getSidechainEthBlock(): Promise<number> {
    try {
      const latestSidechainSynchedEthBlockId = await this.tm.getLatestEthBlockId();
      return latestSidechainSynchedEthBlockId;
    } catch (error) {
      AppLogger.log(`Failed to fetch the latest eth block from the sidechain`, 'SYNC_REQUEST_START_ERROR', 'donald', 1, 0, 0, {}, error);
      throw error;
    }
  }

  /**
   * Do a sync of the whole sidechain or only of the latest blocks
   *
   * @param fullSync
   */
  async syncAll(fullSync: boolean = false) {

    this.tm = config.settings.sawtooth.transaction_manager();

    // Get the block number on eth
    let ethBlockNumber = await this.web3.eth.getBlockNumber();

    // If we are doing a full sync, start the sync from the token deployment block, and the toBlock is the current ethereum block - the confirmation blocks (15)
    // For the latest sync, the fromBlock is the eth block stored on the sidechain, and the toBlock is the current ethereum block - the confirmation blocks (15). Just make sure we have enough blocks to process
    let fromBlock = parseInt(config.settings.ethereum.token_deployment_block, 10) + 1; // The first block is the contract itself

    let toBlock = ethBlockNumber - parseInt(config.settings.ethereum.confirmation_blocks, 10);

    if (!fullSync) {
      fromBlock = await this.getSidechainEthBlock() + 1; // We want to start from the block number + 1, since we already processed that blockNumber the previous time.

      // Check if we have enough blocks to process
      if (toBlock - fromBlock <= 0) {
        AppLogger.log(`Not enough blocks to process, fromBlock=${fromBlock}, toBlock=${toBlock}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0);
        return false;
      }

      if (fromBlock === 1) {
        fromBlock = parseInt(config.settings.ethereum.token_deployment_block, 10) + 1; // The first block is the contract itself
        AppLogger.log(`Looks like we didn't store any latest eth blocks on the sidechain yet, going to start from ${fromBlock}, fromBlock=${fromBlock}, toBlock=${toBlock}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0);
      } else {
        const blocksPerMinute = parseInt(config.settings.ethereum.block_to_process_per_minute, 10);
        if ((fromBlock + blocksPerMinute) <= toBlock) {
          toBlock = fromBlock + blocksPerMinute;
        }  else {
          AppLogger.log(`Not enough blocks to process, fromBlock=${fromBlock}, toBlock=${toBlock}, blocksPerMinute=${blocksPerMinute}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0);
          return false;
        }
      }
    }

    // As long as cont is true, it means there are more rows to fetch from etherscan, it's returning max 1000 rows
    let cont = true;

    const TokenContract = new this.web3.eth.Contract(JSON.parse(this.abi()),config.settings.ethereum.token_address);

    this.tm.setAccumulateTransactions(true);

    while (cont) {
      const list: Transaction[] = await EtherscanApi.getPropsEvents(fromBlock, toBlock);

      if (list.length > 0) {

        // Some counters
        const balanceUpdateTransactions = [];
        let txCounter: number = 0;
        let settleTxCounter: number = 0;
        let totalTx: number = 0;

        // getPropsEvents only returns 10000 results at once, if we get less than 1000 it means we're done and we have all transaction records
        if (list.length < 10000) {
          cont = false;
        }

        AppLogger.log(`Going to get fromBalance and toBalance for each transaction, this will take some time... fromBlock=${fromBlock}, toBlock=${toBlock}, count of transactions=${list.length}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0, { amount: (ethBlockNumber - fromBlock) });

        // Get the start time for measuring the time remaining
        let startTime = new Date().getTime() / 1000;

        // The total time, calculated per batch
        let totalTime = 0;

        // The batch size for which to calculate the time remaining, and also to show a log to show we're still busy, this is purely for information
        const batchSize = 50;

        // Go over each transaction and add them to the transactions list
        for (let x = 0; x < list.length; x += 1) {

          if (x % batchSize === 0 && x > 0) {

            // Get the current time after 50 transactions
            const currentTime = new Date().getTime() / 1000;

            // How long did it take
            const batchTime = currentTime - startTime;

            // Keep track of the total for each batch
            totalTime += batchTime;

            // what is the average time it took for the last batches, in minutes
            const avgTime = totalTime / x / batchSize * 60;

            // Calculate the time remaining
            const timeRemaining = Math.floor(((list.length - x) / batchSize) * avgTime);
            AppLogger.log(`Still working, ${list.length - x} remaining items, estimated time remaining (minutes)=${timeRemaining}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0);
            startTime = new Date().getTime() / 1000;
          }
          const transaction: Transaction = list[x];

          // handle settlement events
          const eventFilterOptions = {
            fromBlock: transaction.blockNumber,
            toBlock: transaction.blockNumber,
            filter: {
              isError: 0,
              txreceipt_status: 1,
            },
          };
                    
          const events = await TokenContract.getPastEvents('Settlement', eventFilterOptions);                      
          for (let i = 0; i < events.length; i += 1) {        
            const event = events[i];
            const eventReturnValues  = event.returnValues;
            // submitSettlementTransaction(privateKey, _applicationId: string, _userId: string, _amount: string, _toAddress: string, _fromAddress: string, _txHash: string, _blockId: number, _timestamp: number):Promise<boolean> {
            const settleTxData: any = {
              appId: String(eventReturnValues['applicationId']).toLowerCase(),
              userId: this.web3.utils.toUtf8(eventReturnValues['userId']),
              amount: eventReturnValues['amount'],
              to: String(eventReturnValues['to']).toLowerCase(),
              from: String(eventReturnValues['rewardsAddress']).toLowerCase(),
              txHash: String(event['transactionHash']).toLowerCase(),
              blockNumber: Number(event['blockNumber']),
              timestamp: Number(transaction.timeStamp),
            }
                    
            AppLogger.log(`settlementTransaction:${JSON.stringify(settleTxData)}`, 'SYNC_REQUEST_PROCESS', 'jon', 1, 0, 0);

            const settlementSubmitResult = await this.tm.submitSettlementTransaction(
              config.settings.sawtooth.validator.pk,
              settleTxData.appId,
              settleTxData.userId,
              settleTxData.amount,
              settleTxData.to,
              settleTxData.from,
              settleTxData.txHash,
              settleTxData.blockNumber,
              settleTxData.timestamp,
            );            
          }

          // handle transfer events (balance updates)
          const toBalance = new BigNumber(await TokenContract.methods.balanceOf(transaction.to).call({}, transaction.blockNumber));
          const fromBalance = new BigNumber(await TokenContract.methods.balanceOf(transaction.from).call({}, transaction.blockNumber));
          const from = String(transaction.from).toLowerCase();
          const to = String(transaction.to).toLowerCase();
          if (from !== '0x0000000000000000000000000000000000000000') {
            if (!(from in balanceUpdateTransactions)) {
              balanceUpdateTransactions[from] = { address: from, balance: fromBalance.toString(), blockNumber: transaction.blockNumber, timestamp: transaction.timeStamp, txHash: String(transaction.hash).toLowerCase() };
              totalTx = totalTx + 1;
            } else {
              if (balanceUpdateTransactions[from].blockNumber < transaction.blockNumber) {
                balanceUpdateTransactions[from] = { address: from, balance: fromBalance.toString(), blockNumber: transaction.blockNumber, timestamp: transaction.timeStamp, txHash: String(transaction.hash).toLowerCase() };
              }
            }
          }
          if (to !== '0x0000000000000000000000000000000000000000') {
            if (!(to in balanceUpdateTransactions)) {
              totalTx = totalTx + 1;
              balanceUpdateTransactions[to] = { address: to, balance: toBalance.toString(), blockNumber: transaction.blockNumber, timestamp: transaction.timeStamp, txHash: String(transaction.hash).toLowerCase() };
            } else {
              if (balanceUpdateTransactions[to].blockNumber < transaction.blockNumber) {
                balanceUpdateTransactions[to] = { address: to, balance: toBalance.toString(), blockNumber: transaction.blockNumber, timestamp: transaction.timeStamp, txHash: String(transaction.hash).toLowerCase() };
              }
            }
          }
        }

        let lastBlockNumber = fromBlock;

        // Submit the transactions
        for (const address in balanceUpdateTransactions) {
          try {
            const submitResult = await this.tm.submitBalanceUpdateTransaction(
              config.settings.sawtooth.validator.pk,
              balanceUpdateTransactions[address].address,
              balanceUpdateTransactions[address].balance,
              balanceUpdateTransactions[address].txHash,
              balanceUpdateTransactions[address].blockNumber,
              balanceUpdateTransactions[address].timestamp,
            );

            txCounter = txCounter + 1;
            AppLogger.log(`balanceUpdateTransaction:${JSON.stringify(balanceUpdateTransactions[address])}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0);

            lastBlockNumber = balanceUpdateTransactions[address].blockNumber;
          } catch (error) {
            AppLogger.log(`Failed to submit balance update for ${txCounter} (out of ${totalTx}) error=${error.message} event=${JSON.stringify(event)}`, 'SYNC_REQUEST_PROCESS_ERROR', 'donald', 1, 0, 0, {}, error);
            throw error;
          }
        }

        await this.storeEthBlockOnSidechain(toBlock);

        try {
          AppLogger.log(`Going to commit to sidechain transactions count=${this.tm.getTransactionCountForCommit()}}`, 'SYNC_REQUEST_PROCESS', 'jon', 1, 0, 0);
          const submitRes = await this.tm.commitTransactions(config.settings.sawtooth.validator.pk);

          if (submitRes) {
            AppLogger.log(`Succesfully submitted balance updates and new eth block for ${totalTx}) events events=${JSON.stringify(balanceUpdateTransactions)}, submitResponse=${JSON.stringify(this.tm.getSubmitResponse())}`, 'SYNC_REQUEST_PROCESS', 'jon', 1, 0, 0);
          } else {
            const msg: string = `Failed submitting balance updates and new eth block for ${totalTx}) events events=${JSON.stringify(balanceUpdateTransactions)}, submitResponse=${JSON.stringify(this.tm.getSubmitResponse())}`;
            throw new Error(msg);
          }

        } catch (error) {
          AppLogger.log(`Failed to submit new eth block update after submitting ${totalTx}) error=${error.message}`, 'SYNC_REQUEST_PROCESS_ERROR', 'jon', 1, 0, 0, {}, error);
          throw error;
        }

        ethBlockNumber = await this.web3.eth.getBlockNumber();
        fromBlock = lastBlockNumber + 1;
        toBlock = ethBlockNumber - parseInt(config.settings.ethereum.confirmation_blocks, 10);
      } else {

        // We didn't get any events between the fromBlock and toBlock, we still want to update the sidechain latest eth block though
        cont = false;

        try {
          this.tm.setAccumulateTransactions(false);
          await this.storeEthBlockOnSidechain(toBlock);
          AppLogger.log(`No events founds for fromBlock=${fromBlock}, toBlock=${toBlock}`, 'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0, { amount: (ethBlockNumber - fromBlock) });
        } catch (error) {
          throw error;
        }

      }
    }

    return true;
  }

  public async storeEthBlockOnSidechain(blockNumber) {
    try {
      const blockData = await this.web3.eth.getBlock(blockNumber);
      const latestConfirmedTimestamp = blockData.timestamp;

      const res = await this.tm.submitNewEthBlockIdTransaction(config.settings.sawtooth.validator.pk, blockNumber, latestConfirmedTimestamp);
    } catch (error) {
      AppLogger.log(`Failed to store the toBlock data on the sidechain`, 'SYNC_REQUEST_START_ERROR', 'donald', 1, 0, 0, {}, error);
      throw error;
    }
  }

  abi(): string {
    // tslint:disable-next-line:max-line-length
    return '[{"constant":false,"inputs":[{"name":"_controller","type":"address"}],"name":"updateController","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_entityType","type":"uint8"},{"name":"_rewardsDay","type":"uint256"}],"name":"getEntities","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getTransferPreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"transferPreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getIncreaseAllowancePreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_name","type":"uint8"},{"name":"_value","type":"uint256"},{"name":"_rewardsDay","type":"uint256"}],"name":"updateParameter","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"maxTotalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"canTransferBeforeStartTime","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_name","type":"uint8"},{"name":"_rewardsDay","type":"uint256"}],"name":"getParameter","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getDecreaseAllowancePreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"_rewardsDay","type":"uint256"},{"name":"_rewardsHash","type":"bytes32"},{"name":"_applications","type":"address[]"},{"name":"_amounts","type":"uint256[]"}],"name":"submitDailyRewards","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"approvePreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"rewardsStartTimestamp","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_rewardsDay","type":"uint256"},{"name":"_applications","type":"address[]"}],"name":"setApplications","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getApprovePreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_entityType","type":"uint8"},{"name":"_name","type":"bytes32"},{"name":"_rewardsAddress","type":"address"},{"name":"_sidechainAddress","type":"address"}],"name":"updateEntity","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_token","type":"address"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"getTransferFromPreSignedHash","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"transferFromPreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_applicationAddress","type":"address"},{"name":"_userId","type":"bytes32"},{"name":"_to","type":"address"},{"name":"_amount","type":"uint256"}],"name":"settle","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"transfersStartTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_rewardsDay","type":"uint256"},{"name":"_validators","type":"address[]"}],"name":"setValidators","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_controller","type":"address"},{"name":"_minSecondsBetweenDays","type":"uint256"},{"name":"_rewardsStartTimestamp","type":"uint256"}],"name":"initializePostRewardsUpgrade1","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"decreaseAllowancePreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"controller","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_signature","type":"bytes"},{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"},{"name":"_fee","type":"uint256"},{"name":"_nonce","type":"uint256"}],"name":"increaseAllowancePreSigned","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"rewardsDay","type":"uint256"},{"indexed":true,"name":"rewardsHash","type":"bytes32"},{"indexed":true,"name":"validator","type":"address"}],"name":"DailyRewardsSubmitted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"rewardsDay","type":"uint256"},{"indexed":true,"name":"rewardsHash","type":"bytes32"},{"indexed":false,"name":"numOfApplications","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"DailyRewardsApplicationsMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"rewardsDay","type":"uint256"},{"indexed":true,"name":"rewardsHash","type":"bytes32"},{"indexed":false,"name":"numOfValidators","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"DailyRewardsValidatorsMinted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"address"},{"indexed":true,"name":"entityType","type":"uint8"},{"indexed":false,"name":"name","type":"bytes32"},{"indexed":false,"name":"rewardsAddress","type":"address"},{"indexed":true,"name":"sidechainAddress","type":"address"}],"name":"EntityUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"uint8"},{"indexed":false,"name":"newValue","type":"uint256"},{"indexed":false,"name":"oldValue","type":"uint256"},{"indexed":false,"name":"rewardsDay","type":"uint256"}],"name":"ParameterUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"validatorsList","type":"address[]"},{"indexed":true,"name":"rewardsDay","type":"uint256"}],"name":"ValidatorsListUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"applicationsList","type":"address[]"},{"indexed":true,"name":"rewardsDay","type":"uint256"}],"name":"ApplicationsListUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"newController","type":"address"}],"name":"ControllerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"applicationId","type":"address"},{"indexed":true,"name":"userId","type":"bytes32"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"rewardsAddress","type":"address"}],"name":"Settlement","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"delegate","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"TransferPreSigned","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":true,"name":"delegate","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"fee","type":"uint256"}],"name":"ApprovalPreSigned","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"decimals","type":"uint8"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_holder","type":"address"},{"name":"_controller","type":"address"},{"name":"_minSecondsBetweenDays","type":"uint256"},{"name":"_rewardsStartTimestamp","type":"uint256"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]';
  }
}


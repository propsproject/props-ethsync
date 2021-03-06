import BigNumber from 'bignumber.js';
import { TransactionManager } from 'propskit';
const { AppLogger } = require('props-lib-logger');
const Web3 = require('web3');

import config from '../config';
import EtherscanApi from './etherscan_api';
import Transaction from '../models/transaction';
import Utils from '../utils/utils';

BigNumber.set({ EXPONENTIAL_AT: 1e+9 });

export default class Sync {

  tm: TransactionManager;
  web3 = new Web3(config.settings.ethereum.uri);
  releaseLock: any;
  retryNum: number = 0;

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

    

    // Get the block number on eth
    this.tm = config.settings.sawtooth.transaction_manager();
    const ethBlockNumber = await this.web3.eth.getBlockNumber();
    AppLogger.log(`syncAll started got ${JSON.stringify(ethBlockNumber)}`, 'SYNC_REQUEST_GET_BLOCK_NUMBER', 'jon', 1, 0, 0);

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

    const TokenContract = new this.web3.eth.Contract(JSON.parse(Utils.abi()),config.settings.ethereum.token_address);

    

    let list: Transaction[];
    while (cont) {
      try {
        list = await EtherscanApi.getPropsEvents(fromBlock, toBlock);
      } catch (err) {
        AppLogger.log(`Could not fetch events from etherscan ${JSON.stringify(err)} fromBlock=${fromBlock}, toBlock=${toBlock}`, 'SYNC_REQUEST_PROCESS_ERRPR', 'jon', 1, 0, 0);
        return false;
      }
      this.tm = config.settings.sawtooth.transaction_manager();
      this.tm.setAccumulateTransactions(true);
      const sleepMS = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
      };
      if (list.length > 0) {

        // Some counters
        const balanceUpdateTransactions = [];
        let txCounter: number = 0;        
        let totalTx: number = 0;
        const settlementTransactions = []; // array to hold already submitted to avoid duplicates
        const settlementEventProcessedBlockNumbers = [];

        // getPropsEvents only returns 10000 results at once, if we get less than 1000 it means we're done and we have all transaction records
        if (list.length < 10000) {
          cont = false;
        }

        AppLogger.log(`Going to get fromBalance and toBalance for each transaction fromBlock=${fromBlock}, toBlock=${toBlock}, count of transactions=${list.length}`, 
                      'SYNC_REQUEST_PROCESS', 'donald', 1, 0, 0, { amount: (ethBlockNumber - fromBlock) });

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
          // handle transfer events (balance updates)
          const toBalance = new BigNumber(await TokenContract.methods.balanceOf(transaction.to).call({}, transaction.blockNumber));
          const fromBalance = new BigNumber(await TokenContract.methods.balanceOf(transaction.from).call({}, transaction.blockNumber));

          if (!(String(transaction.blockNumber) in settlementEventProcessedBlockNumbers)) {
            settlementEventProcessedBlockNumbers[String(transaction.blockNumber)] = true;
          
            const events = await TokenContract.getPastEvents('Settlement', eventFilterOptions);                      
            for (let i = 0; i < events.length; i += 1) {        
              const event = events[i];
              const eventReturnValues  = event.returnValues;
              // submitSettlementTransaction(privateKey, _applicationId: string, _userId: string, _amount: string, _toAddress: string, _fromAddress: string, _txHash: string, _blockId: number, _timestamp: number):Promise<boolean> {
              const txHashLowercase: string = String(event['transactionHash']).toLowerCase();
              const settleTxData: any = {
                appId: String(eventReturnValues['applicationId']).toLowerCase(),
                userId: this.web3.utils.toUtf8(eventReturnValues['userId']),
                amount: eventReturnValues['amount'],
                to: String(eventReturnValues['to']).toLowerCase(),
                from: String(eventReturnValues['rewardsAddress']).toLowerCase(),
                txHash: txHashLowercase,
                blockNumber: Number(event['blockNumber']),
                timestamp: Number(transaction.timeStamp),
                toBalance: toBalance.toString(),
              };
              if (!(txHashLowercase in settlementTransactions)) {
                settlementTransactions[txHashLowercase] = settleTxData.to;
              
                AppLogger.log(`settlementTransaction:${JSON.stringify(settleTxData)}`, 'SYNC_REQUEST_PROCESS_SETTLEMENT', 'jon', 1, 0, 0);

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
                  settleTxData.toBalance,
                );            
              }
            }
          }

          
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
            // only do balance update if it was not settlement
            if (!(String(transaction.hash).toLowerCase() in settlementTransactions && settlementTransactions[String(transaction.hash).toLowerCase()] === to)) {
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
            return false;
          }
        }        
        let submitWithTransactionsSuccess:boolean = false;
        
        while (!submitWithTransactionsSuccess) {
          try {            
            await this.storeEthBlockOnSidechain(toBlock);
            AppLogger.log(`Going to commit to sidechain transactions count=${this.tm.getTransactionCountForCommit()} retry=${this.retryNum}`, 'SYNC_REQUEST_PROCESS', 'jon', 1, 0, 0);
            const submitRes = await this.tm.commitTransactions(config.settings.sawtooth.validator.pk);

            if (submitRes) {
              AppLogger.log(`Succesfully submitted balance updates on retry=${this.retryNum} and new eth block for ${totalTx}) events events=${JSON.stringify(balanceUpdateTransactions)}, submitResponse=${JSON.stringify(this.tm.getSubmitResponse())}`, 'SYNC_REQUEST_PROCESS', 'jon', 1, 0, 0);
              submitWithTransactionsSuccess = true;
            } else {
              const msg: string = `Failed submitting balance updates and new eth block on retry=${this.retryNum} for ${totalTx}) events events=${JSON.stringify(balanceUpdateTransactions)}, submitResponse=${JSON.stringify(this.tm.getSubmitResponse())}`;
              AppLogger.log(msg, 'SYNC_REQUEST_PROCESS_ERROR', 'jon', 1, 0, 0);
              // return false;
            }

          } catch (error) {
            AppLogger.log(`Failed to submit new eth block update after submitting ${totalTx}) retry=${this.retryNum} error=${error.message}`, 'SYNC_REQUEST_PROCESS_ERROR', 'jon', 1, 0, 0, {}, error);
            // return false;
          }
          this.retryNum += 1;
          if (this.retryNum === config.settings.sawtooth.submit_retries) {
            AppLogger.log(`Max retries with events reached retry=${this.retryNum}`, 'SYNC_REQUEST_PROCESS_ERROR', 'jon', 1, 0, 0, {});
            return false;
          } else {
            await sleepMS(1500 * this.retryNum);
          }
        }

        // ethBlockNumber = await this.web3.eth.getBlockNumber();
        fromBlock = lastBlockNumber + 1;
        toBlock = ethBlockNumber - parseInt(config.settings.ethereum.confirmation_blocks, 10);
      } else {

        // We didn't get any events between the fromBlock and toBlock, we still want to update the sidechain latest eth block though
        cont = false;
        let submitNoTransactionsSuccess:boolean = false;
        while (!submitNoTransactionsSuccess) {
          try {
            this.tm.setAccumulateTransactions(false);
            const storeRes = await this.storeEthBlockOnSidechain(toBlock);
            AppLogger.log(`Submitted only new eth block retry=${this.retryNum} ${JSON.stringify(storeRes)} for fromBlock=${fromBlock}, toBlock=${toBlock} response: ${JSON.stringify(this.tm.getSubmitResponse())}`,
                          'SYNC_REQUEST_PROCESS', 'jon', 1, 0, 0, { amount: (ethBlockNumber - fromBlock) });
            submitNoTransactionsSuccess = true;
          } catch (error) {
            AppLogger.log(`Failed to submit new eth block on retry=${this.retryNum} after no events found =${JSON.stringify(error)}`, 'SYNC_REQUEST_PROCESS_ERROR', 'jon', 1, 0, 0, {}, error);            
          }
          this.retryNum += 1;
          if (this.retryNum === config.settings.sawtooth.submit_retries) {
            AppLogger.log(`Max retries no events reached retry=${this.retryNum}`, 'SYNC_REQUEST_PROCESS_ERROR', 'jon', 1, 0, 0, {});
            return false;
          } else {
            await sleepMS(1500 * this.retryNum);
          }
        }
      }
    }

    return true;
  }

  public async storeEthBlockOnSidechain(blockNumber) {
    try {
      AppLogger.log(`Getting block data`, 'SYNC_REQUEST_GET_BLOCK_DATA', 'jon', 1, 0, 0);
      const blockData = await this.web3.eth.getBlock(blockNumber);
      const latestConfirmedTimestamp = blockData.timestamp;

      const res = await this.tm.submitNewEthBlockIdTransaction(config.settings.sawtooth.validator.pk, blockNumber, latestConfirmedTimestamp);
      return { blockNumber, timestamp: blockData.timestamp };
      
    } catch (error) {
      AppLogger.log(`Failed to store the toBlock data on the sidechain`, 'SYNC_REQUEST_START_ERROR', 'donald', 1, 0, 0, {}, error);
      throw error;
    }
  }  
}


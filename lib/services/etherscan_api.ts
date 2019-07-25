import config from '../config';
import rp = require('request-promise-native');
import { AppLogger } from 'props-lib-logger';
import Transaction from '../models/transaction';
import { URLSearchParams } from 'url';

class EtherscanApi {
  static async getPropsEvents(fromBlock, toBlock): Promise<Transaction[]> {

    const filter: any = {
      module: 'account',
      action: 'tokentx',
      startblock: fromBlock,
      endblock: toBlock,
      contractaddress: config.settings.ethereum.token_address,
      apiKey: config.settings.etherscan.api_key,
      order: 'asc',
    };

    const params = new URLSearchParams(filter);

    const url = config.settings.etherscan.url + "?" + params.toString();
    AppLogger.log(`Fetching results from ${url}, fromBlock=${fromBlock}, toBlock=${toBlock}`, 'SYNC_REQUEST_START', 'donald', 0, 0, 0, {}, {});

    const options = {
      url,
      json: true,
      method: 'GET',
    };

    const result = await rp(options);
    const list: Transaction[] = [];
    AppLogger.log(`${url}, fromBlock=${fromBlock}, toBlock=${toBlock} results: ${JSON.stringify(result)}`, 'SYNC_REQUEST_START', 'donald', 0, 0, 0, {}, {});
    if (result.message === 'OK') {
      if  (result.result.length > 0) {
        for (let x = 0; x < result.result.length; x += 1) {
          list.push(new Transaction(result.result[x]));
        }
      }       
    } else if (Number(result.status) === 0) {
      return list;
    }
    
    throw new Error('Could not fetch results from etherscan');
  }
}

export { EtherscanApi as default }

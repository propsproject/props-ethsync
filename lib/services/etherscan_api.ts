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

    if (result.message === 'OK' && result.result.length > 0) {
      for (let x = 0; x < result.result.length; x += 1) {
        list.push(new Transaction(result.result[x]))
      }
    }

    return list;
  }
}

export { EtherscanApi as default }

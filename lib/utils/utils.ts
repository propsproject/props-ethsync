import config from '../config';

const _ = require('lodash');
const ethUtil = require('ethereumjs-util');

class Utils {

  static removePadding(address: string): string {
    return `0x${address.substring(26)}`;
  }

  static getCurrentUnixTimestamp(): number {
    return _.floor(Number(new Date()) / 1000);
  }

  static getCurrentUnixMsTimestamp(): number {
    return _.now();
  }

  static getApplicationIdFromPublicAddress(applicationPublicAddress :string): number {
    const appKeys = config.settings.sawtooth.app_sign_keys;
    let result = -1;

    _.each(appKeys, (keys, appId) => {
      if (keys.address === applicationPublicAddress) {
        result = appId;
        return;
      }
    });

    return result;
  }
}

export default Utils;

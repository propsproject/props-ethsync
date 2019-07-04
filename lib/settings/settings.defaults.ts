import { TransactionManager } from 'propskit';
const _ = require('lodash');

export default () => ({
  sawtooth: {
    transaction_manager: (() => TransactionManager.getInstance({
      familyName: 'pending-earnings',
      familyVersion: '1.0',
      // https: process.env.SAWTOOTH_REST_HTTPS === 'true',
      host: process.env.SAWTOOTH_REST_URL,
      port: _.toNumber(process.env.SAWTOOTH_REST_PORT),

    })),
    validator:
    {
      pk: process.env.SAWTOOTH_PK,
      pub: process.env.SAWTOOTH_PUB,      
    },
  },
  etherscan: {
    api_key: process.env.ETHERSCAN_API_KEY,
    url: process.env.ETHERSCAN_URL,
  },
  ethereum: {
    uri: process.env.ETHEREUM_URL,
    token_address: process.env.PROPS_TOKEN_CONTRACT_ADDRESS,
    token_deployment_block: process.env.PROPS_TOKEN_DEPLOYED_BLOCK,
    confirmation_blocks: process.env.ETHEREUM_CONFIRMATION_BLOCKS,
    block_to_process_per_minute: 15,
    max_blocks_to_process: 500,
    validator_pk: process.env.VALIDATOR_SUBMISSION_PK,
    seconds_in_day: process.env.SECONDS_IN_DAY ? process.env.SECONDS_IN_DAY : 86400,
    avg_block_time: process.env.AVG_BLOCK_TIME ? process.env.AVG_BLOCK_TIME : 15,
    submit_rewards_gas: 1280000,
    gas_price: '20', //gwei
    entity_setup_gas: 250000,
    localhost_test_contract: '',
  },  
  apidoc_users: {
    apidoc: {
      username: 'apidoc',
      password: 'L3w)?y-j%3C9-dpL',
    },
  },
});

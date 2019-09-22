import { TransactionManager } from 'propskit';
const _ = require('lodash');

export default () => ({
  sawtooth: {
    transaction_manager: () => new TransactionManager({
      familyName: 'pending-earnings',
      familyVersion: '1.0',
      https: process.env.SAWTOOTH_REST_HTTPS === 'true',
      host: process.env.SAWTOOTH_REST_URL,
      port: _.toNumber(process.env.SAWTOOTH_REST_PORT),
      rewardsStartTimestamp: process.env.REWARDS_START_TIMESTAMP ? Number(process.env.REWARDS_START_TIMESTAMP) : 1562803200,
      secondsInDay: process.env.SECONDS_IN_DAY ? Number(process.env.SECONDS_IN_DAY) : 86400,      
    }),
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
    uri: process.env.ETHEREUM_URL_ETHSYNC,
    token_address: process.env.PROPS_TOKEN_CONTRACT_ADDRESS,
    token_deployment_block: process.env.PROPS_TOKEN_DEPLOYED_BLOCK,
    confirmation_blocks: process.env.ETHEREUM_CONFIRMATION_BLOCKS,
    block_to_process_per_minute: process.env.ETHEREUM_BLOCKS_TO_PROCESS_PER_JOB ? process.env.ETHEREUM_BLOCKS_TO_PROCESS_PER_JOB : 20,
    max_blocks_to_process: 500,
    validator_pk: process.env.VALIDATOR_SUBMISSION_PK,
    seconds_in_day: process.env.SECONDS_IN_DAY ? Number(process.env.SECONDS_IN_DAY) : 86400,
    avg_block_time: process.env.AVG_BLOCK_TIME ? Number(process.env.AVG_BLOCK_TIME) : 15,
    submit_rewards_gas: 1280000,
    gas_price: '20', //gwei
    entity_setup_gas: 250000,
    entity_setup_multisig_gas: 500000,
    localhost_test_contract: '',
  },
  rewards: {
    totalCoefficient: process.env.REWARDS_CALC_TOTAL_COEFFICIENT ? process.env.REWARDS_CALC_TOTAL_COEFFICIENT : 0.35,
    medianCoefficient: process.env.REWARDS_CALC_MEDIAN_COEFFICIENT ? process.env.REWARDS_CALC_MEDIAN_COEFFICIENT : 0.15,
    userCoefficient: process.env.REWARDS_CALC_USER_COEFFICIENT ? process.env.REWARDS_CALC_USER_COEFFICIENT : 0.5,
  },
  activity: {
    state_rest_uri: process.env.STATE_API_URI ? process.env.STATE_API_URI : 'https://staging-state.sidechain.propsproject.io/state/activity/summary',
  },
  apidoc_users: {
    apidoc: {
      username: 'apidoc',
      password: 'L3w)?y-j%3C9-dpL',
    },
  },
});

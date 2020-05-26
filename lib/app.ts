import SyncService from './services/sync';
import ValidatorSetup from './services/validator_setup';
import ApplicationSetup from './services/application_setup';
import DailyRewards from './services/daily_rewards';
import CreateNewWallet from './services/create_new_wallet';

const commander = require('commander');

const program  = new commander.Command();
program.version('0.0.1');

program
  .option('-a, --sync-all', 'Resync the whole sidechain')
  .option('-l, --sync-latest', 'Sync the latest blocks')
  .option('-v, --validator-setup', 'Setup a validator on etheruem')
  .option('-ap, --application-setup', 'Setup an application on etheruem')
  .option('-s, --submit-rewards', 'Submit daily rewards summary data')
  .option('-c, --create-wallet', 'Create a new wallet')
  .option('-msv, --multisig-validator-setup', 'Setup a validator on etheruem via multisig wallet')
  .option('-msap, --multisig-application-setup', 'Setup an application on etheruem via multisig wallet')
  .option('-safev, --safe-validator-setup', 'Setup a validator on etheruem via gnosis safe multisig wallet')
  .option('-safeap, --safe-application-setup', 'Setup an application on etheruem via gnosis safe multisig wallet');

program.parse(process.argv);

if (program.syncAll) {
  const sync = new SyncService();
  sync.syncAll(true).then(() => {
    console.log('Complete sync is done');
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  })
} else if (program.syncLatest) {
  const sync = new SyncService();
  sync.syncAll(false).then(() => {
    console.log('Latest sync is done');
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.validatorSetup) {
  const validatorSetup = new ValidatorSetup();  
  validatorSetup.setup(process.argv[3], process.argv[4], process.argv[5]).then(() => {
    console.log(`Setup validator with ${process.argv[3]}, ${process.argv[4]}, ${process.argv[5]}`);
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.applicationSetup) {
  const applicationSetup = new ApplicationSetup();  
  applicationSetup.setup(process.argv[3], process.argv[4], process.argv[5], process.argv[6]).then(() => {
    console.log(`Setup application with ${process.argv[3]}, ${process.argv[4]}, ${process.argv[5]}, ${process.argv[6]}`);
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.submitRewards) {
  const dailyRewards = new DailyRewards();  
  dailyRewards.calculateAndSubmit().then(() => {
    console.log(`Calculated and submitted rewards succesfully`);
    process.exit(0);    
  }).catch((error) => {
    console.log(error);
    process.exit(1);
  });
} else if (program.createWallet) {
  const createNewWallet = new CreateNewWallet();  
  createNewWallet.generate().then((walletInfo) => {
    console.log(`Generated wallet with following info: ${JSON.stringify(walletInfo)}`);
    process.exit(0);    
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.multisigValidatorSetup) {
  const validatorSetup = new ValidatorSetup();  
  validatorSetup.setupViaMultiSig(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]).then(() => {
    console.log(`Setup validator with ${process.argv[3]}, ${process.argv[4]}, ${process.argv[5]}, ${process.argv[6]}, ${process.argv[7]}`);
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.multisigApplicationSetup) {
  const applicationSetup = new ApplicationSetup();  
  applicationSetup.setupViaMultiSig(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]).then(() => {
    console.log(`Setup application with ${process.argv[3]}, ${process.argv[4]}, ${process.argv[5]}, ${process.argv[6]}, ${process.argv[7]}`);
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.safeValidatorSetup) {
  const validatorSetup = new ValidatorSetup();  
  validatorSetup.setupViaSafe(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]).then(() => {
    console.log(`Setup validator with ${process.argv[3]}, ${process.argv[4]}, ${process.argv[5]}, ${process.argv[6]}, ${process.argv[7]}`);
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
} else if (program.safeApplicationSetup) {
  const applicationSetup = new ApplicationSetup();  
  applicationSetup.setupViaSafe(process.argv[3], process.argv[4], process.argv[5], process.argv[6], process.argv[7]).then(() => {
    console.log(`Setup application with ${process.argv[3]}, ${process.argv[4]}, ${process.argv[5]}, ${process.argv[6]}, ${process.argv[7]}`);
    process.exit(0);
  }).catch((error) => {
    console.log(error);
    process.exit(0);
  });
}

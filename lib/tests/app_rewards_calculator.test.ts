// Mock AppLogger to make output of the tests cleaner
require('../tests/global_hooks');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
import 'mocha';
import { Activity, AppRewardsCalcuator } from '../rewards/app_rewards_calculator';
import Decimal from 'decimal.js';

chai.use(chaiAsPromised);

const expect = chai.expect;
// const should = chai.should;
// const assert = chai.assert;

describe('AppRewardsCalculator Tests', async () => {
  const app1activityArr:Activity[] = [
    {
      applicationId: 'abc',
      balance: {
        linkedWallet: '',
        balanceDetails: {
          pending: '5995300000000000000000',
          totalPending: '5995300000000000000000',
          transferable: '1650000000000000000000',
        },
      },
    },
    {
      applicationId: 'abc',
      balance: {
        linkedWallet: '0x123abc',
        balanceDetails: {
          pending: '1005000000000000000000',
          totalPending: '1005000000000000000000',
          transferable: '0',
        },
      },
    },
    {
      applicationId: 'abc',
      balance: {
        linkedWallet: '',
        balanceDetails: {
          pending: '3200000000000000000000',
          totalPending: '3200000000000000000000',
          transferable: '750000000000000000000',
        },
      },
    },
    {
      applicationId: 'abc',
      balance: {
        linkedWallet: '0xaaaaaa',
        balanceDetails: {
          pending: '0',
          totalPending: '0',
          transferable: '0',
        },
      },
    },
    {
      applicationId: 'abc',
      balance: {
        linkedWallet: '0xbbbbb',
        balanceDetails: {
          pending: '0',
          totalPending: '0',
          transferable: '1100000000000000000000',
        },
      },
    },
  ];
  const app2activityArr:Activity[] = [
    {
      applicationId: 'def',
      balance: {
        linkedWallet: '',
        balanceDetails: {
          pending: '703123000000000000000',
          totalPending: '703123000000000000000',
          transferable: '1650000000000000000000',
        },
      },
    },
    {
      applicationId: 'def',
      balance: {
        linkedWallet: '0x123abc',
        balanceDetails: {
          pending: '2142390000000000000000',
          totalPending: '2142390000000000000000',
          transferable: '0',
        },
      },
    },
    {
      applicationId: 'def',
      balance: {
        linkedWallet: '',
        balanceDetails: {
          pending: '4550367973389411589000',
          totalPending: '4550367973389411589000',
          transferable: '250000000000000000000',
        },
      },
    },
    {
      applicationId: 'def',
      balance: {
        linkedWallet: '0xaaaaaa',
        balanceDetails: {
          pending: '0',
          totalPending: '0',
          transferable: '0',
        },
      },
    },
  ];
  let appRewardCalc:AppRewardsCalcuator = new AppRewardsCalcuator();
  appRewardCalc.generateSummary('abc',app1activityArr);
  before(async () => {

  });

  it('Sum is calculated correctly', async() => {    
    expect(appRewardCalc.appSummaries['abc'].sum.toString()).to.be.equal('13700300000000000000000');    
  });

  it('Median is calculated correctly', async() => {
    expect(appRewardCalc.appSummaries['abc'].median.toString()).to.be.equal('2525000000000000000000');    
  });

  it('Users number is calculated correctly', async() => {
    expect(appRewardCalc.appSummaries['abc'].usersCount).to.be.equal(4);    
  });

  it('Props totals part calculation is correct', async() => {
    const appSum: Decimal = new Decimal(42000);
    const totalSum: Decimal = appSum.times(20);
    const coefficient: number = 0.25;
    const totalsPart: Decimal = appRewardCalc.getTotalsPart(appSum, totalSum, coefficient);
    expect(totalsPart.toString()).to.be.equal('0.0125');
  });

  it('Median part calculation is correct', async() => {
    const app1Median: Decimal = new Decimal(42000);
    const app2Median: Decimal = new Decimal(24000);
    const app3Median: Decimal = new Decimal(8000);
    const appsMedianLogSum: Decimal = (app1Median.plus(1)).logarithm().plus((app2Median.plus(1)).logarithm()).plus((app3Median.plus(1)).logarithm());
    const coefficient: number = 0.25;
    const medianPart: Decimal = appRewardCalc.getMedianPart(app1Median, appsMedianLogSum, coefficient);
    expect(medianPart.toString().substr(0,21)).to.be.equal('0.0895520068126569872');
  });

  it('Users part calculation is correct', async() => {
    const appUsers: number = 300;
    const totalUsers: number = 1500;    
    const coefficient: number = 0.25;
    const usersPart: number = appRewardCalc.getUsersPart(appUsers, totalUsers, coefficient);
    expect(usersPart).to.be.equal(0.05);
  });  

  it('App rewards with 1 app gives all rewards to the app', async() => {
    const dailyRewardsAmount: Decimal = new Decimal(1000000);
    appRewardCalc.calcRewards(dailyRewardsAmount);
    expect(appRewardCalc.appRewards['abc'].toString()).to.be.equal(dailyRewardsAmount.toString());
  });

  it('App rewards with 2 apps calculates rewards per app correctly', async() => {
    appRewardCalc = new AppRewardsCalcuator();
    appRewardCalc.generateSummary('abc',app1activityArr);
    appRewardCalc.generateSummary('def',app2activityArr);    
    const dailyRewardsAmount: Decimal = (new Decimal(100000)).times(1e18);
    appRewardCalc.calcRewards(dailyRewardsAmount);
    expect(appRewardCalc.appRewards['abc'].toString()).to.be.equal('56685186164768248284000');
    expect(appRewardCalc.appRewards['def'].toString()).to.be.equal('43314813835231741717000');
  });
  

  

  after(async () => {
  });

});

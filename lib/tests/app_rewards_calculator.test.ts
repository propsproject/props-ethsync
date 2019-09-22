// Mock AppLogger to make output of the tests cleaner
require('../tests/global_hooks');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
import 'mocha';
import { AppRewardsCalcuator } from '../rewards/app_rewards_calculator';
import Decimal from 'decimal.js';

chai.use(chaiAsPromised);

const expect = chai.expect;
// const should = chai.should;
// const assert = chai.assert;

describe('AppRewardsCalculator Tests', async () => {
  
  let appRewardCalc:AppRewardsCalcuator = new AppRewardsCalcuator();
  // appRewardCalc.generateSummary('abc',app1activityArr);
  before(async () => {

  });

  // it('Sum is calculated correctly', async() => {    
  //   expect(appRewardCalc.appSummaries['abc'].sum.toString()).to.be.equal('13700300000000000000000');    
  // });

  // it('Median is calculated correctly', async() => {
  //   expect(appRewardCalc.appSummaries['abc'].median.toString()).to.be.equal('2525000000000000000000');    
  // });

  // it('Users number is calculated correctly', async() => {
  //   expect(appRewardCalc.appSummaries['abc'].usersCount).to.be.equal(4);    
  // });

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
    const app1MedianLog: Decimal = (app1Median.plus(1)).logarithm();    
    const coefficient: number = 0.25;
    const medianPart: Decimal = appRewardCalc.getMedianPart(app1MedianLog, appsMedianLogSum, coefficient);
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
    const payload:any = {
      summary: {
        rewards_day: 2134,
        applications: 1,
        users: 728666,
        props: 3640379084.9465957,
        median_log: 11.049005572788003,
      },
      applications: [
        {
          app_id: '0x11146f8af393d422cd6feee9040c2512111',
          props: '3640379084.9465957',
          users: '728666',
          median_log: 11.049005572788003,
        },        
      ],      
    };
    appRewardCalc.calcRewards(dailyRewardsAmount, payload);
    expect(appRewardCalc.appRewards['0x11146f8af393d422cd6feee9040c2512111'].toString()).to.be.equal(dailyRewardsAmount.toString());
  });

  it('App rewards with 3 apps calculates rewards per app correctly', async() => {
    appRewardCalc = new AppRewardsCalcuator();
    // appRewardCalc.totalCoefficient = 0.25;
    // appRewardCalc.medianCoefficient = 0.25;
    // appRewardCalc.userCoefficient = 0.25;    
    const payload:any = {
      summary: {
        rewards_day: 2134,
        applications: 3,
        users: 728666,
        props: 3640379084.9465957,
        median_log: 11.049005572788003,
      },
      applications: [
        {
          app_id: '0x11146f8af393d422cd6feee9040c2512111',
          props: '682921.312394100000000000',
          users: '144',
          median_log: 3.65333796096704,
        },
        {
          app_id: '0x6946f8af393d422cd6feee9040c25121a3b8',
          props: '1342672054.883276946000000000',
          users: '268858',
          median_log: 3.697105723998962,
        },
        {
          app_id: '0xa80a6946f8af393d422cd6feee9040c25121a3b8',
          props: '2297024108.750924523000000000',
          users: '459664',
          median_log: 3.698561887822,
        },
      ],      
    };
    
    const dailyRewardsAmount: Decimal = (new Decimal(100000)).times(1e18);
    appRewardCalc.calcRewards(dailyRewardsAmount, payload);
    expect(appRewardCalc.appRewards['0x11146f8af393d422cd6feee9040c2512111'].toString()).to.be.equal('4976175580485749400800');
    expect(appRewardCalc.appRewards['0x6946f8af393d422cd6feee9040c25121a3b8'].toString()).to.be.equal('36376755578524325097000');
    expect(appRewardCalc.appRewards['0xa80a6946f8af393d422cd6feee9040c25121a3b8'].toString()).to.be.equal('58647068840989920993000');
  });
  

  

  after(async () => {
  });

});

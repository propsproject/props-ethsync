import Decimal from 'decimal.js';
const { AppLogger } = require('props-lib-logger');
Decimal.set({ toExpPos: 9e15 });

import config from '../config';

interface BalanceDetails {
  pending: string; // Decimal
  totalPending: string; // Decimal
  transferable: string; // Decimal
}

interface Balance {
  linkedWallet: string;
  balanceDetails: BalanceDetails;
} 
  
interface Activity {
  applicationId: string;
  balance: Balance;
}

interface AppCalculatedSummary {
  sum: Decimal;
  median: Decimal;
  usersCount: number;

}

class AppRewardsCalcuator {
  totalCoefficient: number;
  medianCoefficient: number;
  userCoefficient: number;

  appSummaries: { [appId: string]: AppCalculatedSummary };
  appRewards: { [appId: string]: Decimal};
  apps: string[];
  
  constructor() {
    this.totalCoefficient = config.settings.rewards.totalCoefficient;
    this.medianCoefficient = config.settings.rewards.medianCoefficient;
    this.userCoefficient = config.settings.rewards.userCoefficient;
    this.appSummaries = {};
    this.appRewards = {};
    this.apps = [];
  }

  public calcRewards(dailyRewardsAmount: Decimal, payload:any) {
    // console.log(`************** payload=${JSON.stringify(payload)}`);
    let sumTotal: Decimal = new Decimal(payload['summary']['props']);
    let medianLogTotal: Decimal = new Decimal(payload['summary']['median_log']);
    const usersTotal: number = Number(payload['summary']['users']);
    
    sumTotal = sumTotal.mul(1e18);
    medianLogTotal = medianLogTotal.mul(1e18);
    // console.log(`************** totals=${sumTotal},${medianLogTotal},${usersTotal}`);
    const applicationsCount:number = Number(payload['summary']['applications']);
    for (let i = 0; i < applicationsCount; i += 1) {
      let appSum: Decimal = new Decimal(payload['applications'][i]['props']);
      appSum = appSum.mul(1e18);
      let appMedian: Decimal = new Decimal(payload['applications'][i]['median_log']);
      appMedian = appMedian.mul(1e18);
      const appUsers: number = payload['applications'][i]['users'];
      const totalsPart: Decimal = this.getTotalsPart(appSum, sumTotal, this.totalCoefficient);
      const medianPart: Decimal = this.getMedianPart(appMedian, medianLogTotal, this.medianCoefficient);
      const usersPart: number = this.getUsersPart(appUsers, usersTotal, this.userCoefficient);
      // console.log(`************** applicationId=${payload['applications'][i]['app_id']}, ${appSum},${appMedian},${appUsers}`);
      this.appRewards[payload['applications'][i]['app_id']] = dailyRewardsAmount.times(totalsPart.plus(medianPart).plus(usersPart));
      // console.log(`************** applicationId=${payload['applications'][i]['app_id']}, rewards=${this.appRewards[payload['applications'][i]['app_id']]}`);
    }    
  }

  public getTotalsPart(appSum: Decimal, totalSum:Decimal, coefficient: number): Decimal {
    // console.log(`appSum=${appSum.toString()}, totalSum=${totalSum.toString()}, coefficient=${coefficient}`);
    return appSum.times(coefficient).div(totalSum);
  }

  public getMedianPart(appMedian: Decimal, medianLogSum:Decimal, coefficient: number): Decimal {
    return (appMedian.plus(1)).logarithm().times(coefficient).div(medianLogSum);
  }

  public getUsersPart(appUsersCount: number, usersTotal: number, coefficient: number): number {
    return coefficient * (appUsersCount / usersTotal);
  }

  /*
  public generateSummary(appId: string, appActivity:Activity[]): void {
    const summary: AppCalculatedSummary = {
      sum: new Decimal(0),
      median: new Decimal(0),
      usersCount: 0,
    };    
    const totals: Decimal[] = [];
    for (let i = 0; i < appActivity.length; i += 1) {      
      if (appActivity[i].balance.balanceDetails !== undefined) {
        const pending: Decimal = new Decimal(appActivity[i].balance.balanceDetails.pending);
        const transferable: Decimal = new Decimal(appActivity[i].balance.balanceDetails.transferable);
        const total: Decimal = pending.plus(transferable);      
        summary.sum = summary.sum.plus(total);
        if (total.greaterThan(0)) {
          summary.usersCount += 1;
          totals.push(total);
        }
      }
    }
    summary.median = this.medianBN(totals);    
    this.appSummaries[appId] = summary;
    this.apps.push(appId);
  }
  

  private medianBN(values:Decimal[]): Decimal {
    if (values.length === 0) return new Decimal(0);    
    values.sort((a: Decimal,b: Decimal) => {
      return a.minus(b).toNumber();
    });    
    const half: number = Math.floor(values.length / 2);
  
    if (values.length % 2)
      return values[half];    
    return (values[half - 1].plus(values[half])).div(2);
  }
  */

}

export { AppRewardsCalcuator, Balance, BalanceDetails, Activity }

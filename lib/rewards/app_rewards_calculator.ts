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

  public calcRewards(dailyRewardsAmount: Decimal) {
    let sumTotal: Decimal = new Decimal(0);
    let medianLogTotal: Decimal = new Decimal(0);
    let usersTotal: number = 0;
    // calculate sums
    for (let i = 0; i < this.apps.length; i += 1) {
      sumTotal = sumTotal.plus(this.appSummaries[this.apps[i]].sum);
      medianLogTotal = medianLogTotal.plus((this.appSummaries[this.apps[i]].median.plus(1)).logarithm());
      usersTotal = usersTotal + this.appSummaries[this.apps[i]].usersCount;
    }
    // calculate rewards per app
    for (let i = 0; i < this.apps.length; i += 1) {
      // console.log(`appSummaries=${JSON.stringify(this.appSummaries)}`);
      // console.log(`this.apps[i]=${this.apps[i]}`);
      const totalsPart: Decimal = this.getTotalsPart(this.appSummaries[this.apps[i]].sum, sumTotal, this.totalCoefficient);
      const medianPart: Decimal = this.getMedianPart(this.appSummaries[this.apps[i]].median, medianLogTotal, this.medianCoefficient);
      const usersPart: number = this.getUsersPart(this.appSummaries[this.apps[i]].usersCount, usersTotal, this.userCoefficient);
      this.appRewards[this.apps[i]] = dailyRewardsAmount.times(totalsPart.plus(medianPart).plus(usersPart));        
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

}

export { AppRewardsCalcuator, Balance, BalanceDetails, Activity }

# props-eth-sync

![Props Token](https://propsproject.com/static/images/main-logo.png)

The tools in this repo are provide functionalites for validator nodes to perform the following operations:

## Validator Setup
```npm run setup-validator -- {validatorName} {rewardsAddress} {sidechainAddress}```
[validator_setup](./lib/services/validator_setup.ts)
*validatorName* - name to represent your validator
*rewardsAddress* - address where validator rewards should be minted to
*sidechainAddress* - address to be used to confirm validator transactions to the sidechain

After setting up your validator, you need to provide us with the sidechainAddress so we can add you as a valid validator.

## Calculate and Submit Daily Rewards
```npm run submit-rewards```
[daily_rewards](./lib/services/daily_rewards.ts)
Once a day calculate activity for the active apps and submit to the PropsToken contract on Ethereum the rewards that each application shuold get

**Setup:**
Setup as a cronjob to run at the begining of each day (UTC)

## Synching
```npm run sync-latest```
[sync](./lib/services/sync.ts)

Listening to events of the PropsToken contract on Ethereum and submitting the data to the Props Sidechain.

**Setup:**
Setup as a cronjob to run every minute

***Events***
**Transfer (Event)**
Each props token transfer triggers this event. The balances of the sender and receiver are calculated for that block and are submitted to the sidechain so sidechain can store on-chain balance for all users to be used by applications in the props eco-system



const fs = require('fs')

let defaults = {}
// let test = {}
let development = {}
let staging = {}
let production = {}
let playground = {}

// if (fs.existsSync(`${__dirname}/settings.test.ts`) || fs.existsSync(`${__dirname}/settings.test.js`)) {
//   test = require(`./settings.test`);
// }

if (fs.existsSync(`${__dirname}/settings.defaults.ts`) || fs.existsSync(`${__dirname}/settings.defaults.js`)) {
  defaults = require(`./settings.defaults`);
}

if (fs.existsSync(`${__dirname}/settings.development.ts`) || fs.existsSync(`${__dirname}/settings.development.js`)) {
  development = require(`./settings.development`);
}

if (fs.existsSync(`${__dirname}/settings.playground.ts`) || fs.existsSync(`${__dirname}/settings.playground.js`)) {
  playground = require(`./settings.playground`);
}

if (fs.existsSync(`${__dirname}/settings.production.ts`) || fs.existsSync(`${__dirname}/settings.production.js`)) {
  production = require(`./settings.production`);
}

if (fs.existsSync(`${__dirname}/settings.staging.ts`) || fs.existsSync(`${__dirname}/settings.staging.js`)) {
  staging = require(`./settings.staging`);
}

const settings = {
  defaults,  
  development,
  playground,
  staging,
  production,
};

export { settings as default };

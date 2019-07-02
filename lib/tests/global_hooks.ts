import 'babel-polyfill';
const { AppLogger } = require('props-lib-logger');
const sinon = require('sinon');

before('Mock AppLogger to cleanup tests', () => {
  sinon.stub(AppLogger, 'log');
  sinon.stub(AppLogger, 'error');
  sinon.stub(AppLogger, 'info');
});

after(() => {
  AppLogger.log.restore();
  AppLogger.info.restore();
  AppLogger.error.restore();
  // @ts-ignore
  // global.asyncDump();
});

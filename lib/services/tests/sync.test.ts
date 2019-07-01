// Mock AppLogger to make output of the tests cleaner
require('../../tests/global_hooks');
const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
import 'mocha';
import Issue from '../issue';
import Request from '../../models/request/request';
import RequestHandlerManager from '../../managers/request_handler_manager';

chai.use(chaiAsPromised);

const expect = chai.expect;
// const should = chai.should;
// const assert = chai.assert;

describe('Issue tests', async () => {

  let RequestHandlerManager_queueRequestStub;
  
  before(async () => {    
    RequestHandlerManager_queueRequestStub = sinon.stub(RequestHandlerManager, 'queueRequest').callsFake(() => {
      // console.log('***** sinon ***** queueRequest stub returns true');
      return true;
    });
  });

  it('Succesfully receive a valid issue earning request', async() => {
    const appId: number = 1;
    const wallet: string = '0x42EB768f2244C8811C63729A21A3569731535f06';
    const amount: number = 100;
    const res = await Issue.run({
      app_id: appId,
      wallet,
      amount,      
    });
    const reqId: number = res.request_id;
    expect(res.request_id).to.be.gt(0);
    const req:Request = new Request(reqId);
    await req.delete();
  });

  it('Reject invalid wallet issue earning request', async() => {
    const appId: number = 1;
    const wallet: string = '0x0AAA0AAA0AAA0AAA0AAA0AAA0';    
    const amount: number = 100;
    try {
      await Issue.run({
        app_id: appId,
        wallet,
        amount,      
      });
    } catch (error) {
      expect(error.message).to.be.equal('ISSUE_REQUEST_INVALID_PAYLOAD_ERROR');
    }    
  });

  it('Reject invalid amount issue earning request', async() => {
    const appId: number = 1;
    const wallet: string = '0x42EB768f2244C8811C63729A21A3569731535f06';    
    const amount: number = 0;
    try {
      await Issue.run({
        app_id: appId,
        wallet,
        amount,      
      });
    } catch (error) {
      expect(error.message).to.be.equal('ISSUE_REQUEST_INVALID_PAYLOAD_ERROR');
    }    
  });

  after(async () => {
    RequestHandlerManager_queueRequestStub.restore();
  });

});

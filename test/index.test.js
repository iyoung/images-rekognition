'use strict';

const chai = require('chai');
const should = require('chai').should();
const sinon = require('sinon');
const AWSUtils = require('@press-association/aws-utils');
const sns = new AWSUtils({region: 'foo-bar-1'}).SNS();
const rekog = require('../lib/rekog');

// Fixtures
const NOTIFICATION_INPUT_1 = require(`${__dirname}/fixtures/pa-1-sns.input.json`);

let lambda, sandbox, publishStub, rekogKeywordStub, rekogPeopleStub, rekogTextStub, rekogModStub, kwMeta, personMeta;

describe('lambda', () => {
  before(function(done) {
    sandbox = sinon.sandbox.create();
    //publishStub = sandbox.stub(sns, 'publish');
    rekogKeywordStub = sandbox.stub(rekog, 'decorateWithKeywords');
    rekogPeopleStub = sandbox.stub(rekog, 'decorateWithPeople');
    rekogTextStub = sandbox.stub(rekog, 'decorateWithDetectedText');
    rekogModStub = sandbox.stub(rekog, 'decorateWithModerationWarnings');
    rekogKeywordStub.returns(Promise.resolve([]));
    rekogPeopleStub.returns(Promise.resolve([]));
    rekogTextStub.returns(Promise.resolve([]));
    rekogModStub.returns(Promise.resolve([]));

    let rekogSetImage = sandbox.stub(rekog, 'setImage');
    rekogSetImage.returns(null);

    sandbox.stub(AWSUtils.prototype, 'SNS').callsFake(() => {
      return {
        extractSNSNotification: () => Promise.resolve(JSON.parse(NOTIFICATION_INPUT_1.Records[0].Sns.Message)),
        publish: publishStub
      };
    });

    lambda = require('../index');

    done();
  });

  after(function(done) {
    sandbox.restore();
    done();
  });

  it('should exist', (done) => {
    should.exist(lambda);
    done();
  });

  describe('handler()', () => {
    it('Each decorator function should be called', (done) => {
     lambda.handler(NOTIFICATION_INPUT_1, null, (err, res) => {
       should.not.exist(err);
       rekogKeywordStub.calledOnce.should.equal(true);
       rekogPeopleStub.calledOnce.should.equal(true);
       rekogTextStub.calledOnce.should.equal(true);
       rekogModStub.calledOnce.should.equal(true);
       done();
     });
    });

    it('The response JSON should match the expected', (done) => {
      let expectedResponse = {keywords: [], people: [], text: [], adultContent: []};
      lambda.handler(NOTIFICATION_INPUT_1, null, (err, res) => {
        should.not.exist(err);
        should.exist(res.extendedContent);
        res.extendedContent.should.deep.equal(expectedResponse);
        done();
      });
    });

  });
});

'use strict';

const chai = require('chai');
const should = require('chai').should();
const sinon = require('sinon');
const AWSUtils = require('@press-association/aws-utils');
const sns = new AWSUtils({region: 'foo-bar-1'}).SNS();
const rekog = require('../lib/rekog');

// Fixtures
const NOTIFICATION_INPUT_1 = require(`${__dirname}/fixtures/pa-1-sns.input.json`);

let lambda, sandbox, publishStub, rekogKeywordStub, rekogPeopleStub, kwMeta, personMeta;

describe('lambda', () => {
  before(function(done) {
    sandbox = sinon.sandbox.create();
    publishStub = sandbox.stub(sns, 'publish');
    rekogKeywordStub = sandbox.stub(rekog, 'decorateWithKeywords');
    rekogPeopleStub = sandbox.stub(rekog, 'decorateWithPeople');
    kwMeta = JSON.parse(NOTIFICATION_INPUT_1.Records[0].Sns.Message);
    kwMeta.metadata.detectedKeywords = [
      "test1",
      "test2"
    ];
    rekogKeywordStub.returns(kwMeta);
    personMeta = kwMeta;
    personMeta.metadata.detectedPersonInImage = [
      "Ian Young"
    ];
    rekogPeopleStub.returns(personMeta);
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
    it('Should add keywords to the metadata for items recognised', (done) => {
     lambda.handler(NOTIFICATION_INPUT_1, null, (err, res) => {
       should.not.exist(err);
       let expectedMessage = JSON.parse(NOTIFICATION_INPUT_1.Records[0].Sns.Message);
       rekogKeywordStub.calledWith(expectedMessage).should.equal(true);
       done();
     });
    });

    it('Should add people to the metadata for items recognised', (done) => {
     lambda.handler(NOTIFICATION_INPUT_1, null, (err, res) => {
       should.not.exist(err);
       rekogPeopleStub.calledWith(kwMeta).should.equal(true);
       res.should.equal(personMeta.metadata);
       done();
     });
    });

  });
});

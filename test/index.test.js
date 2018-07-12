'use strict';

const should = require('chai').should();
const sinon = require('sinon');
const AWSUtils = require('@press-association/aws-utils');
const sns = new AWSUtils({region: 'foo-bar-1'}).SNS();
const rekog = require('../lib/rekog');
const semantic = require('../lib/semantic');

// Fixtures
const NOTIFICATION_INPUT_1 = require(`${__dirname}/fixtures/pa-1-sns.input.json`);
const NOTIFICATION_INPUT_2 = require(`${__dirname}/fixtures/pa-2-sns.input.json`);

let lambda, sandbox, publishStub, stubs;

describe('lambda', () => {
  beforeEach(function(done) {
    sandbox = sinon.sandbox.create();
    publishStub = sandbox.stub(sns, 'publish');
    stubs = [];
    stubs['rekogKeywordStub'] = sandbox.stub(rekog, 'decorateWithKeywords');
    stubs['rekogPeopleStub'] = sandbox.stub(rekog, 'decorateWithPeople');
    stubs['rekogFacesStub'] = sandbox.stub(rekog, 'decorateWithFaces');
    stubs['rekogTextStub'] = sandbox.stub(rekog, 'decorateWithDetectedText');
    stubs['rekogModStub'] = sandbox.stub(rekog, 'decorateWithModerationWarnings');
    stubs['semanticEntitiesStub'] = sandbox.stub(semantic, 'decorateWithEntities');
    stubs['rekogKeywordStub'].returns(Promise.resolve(["test"]));
    stubs['rekogPeopleStub'].returns(Promise.resolve(["test"]));
    stubs['rekogFacesStub'].returns(Promise.resolve(["test"]));
    stubs['rekogTextStub'].returns(Promise.resolve(["test"]));
    stubs['rekogModStub'].returns(Promise.resolve(["test"]));
    stubs['semanticEntitiesStub'].returns(Promise.resolve(["test"]));

    let rekogSetImage = sandbox.stub(rekog, 'setImage');
    rekogSetImage.returns(null);

    lambda = require('../index');

    done();
  });

  afterEach(function(done){
    sandbox.restore();
    done();
  });

  function _setSNS(snsMessage) {
    sandbox.stub(AWSUtils.prototype, 'SNS').callsFake(() => {
      return {
        extractSNSNotification: () => Promise.resolve(JSON.parse(snsMessage.Records[0].Sns.Message)),
        publish: publishStub
      };
    });
  }

  it('should exist', (done) => {
    should.exist(lambda);
    done();
  });

  describe('handler()', () => {
    it('Each decorator function should be called', (done) => {
      _setSNS(NOTIFICATION_INPUT_1);
      lambda.handler(NOTIFICATION_INPUT_1, null, (err, res) => {
        should.not.exist(err);
        stubs['rekogKeywordStub'].calledOnce.should.equal(true);
        stubs['rekogPeopleStub'].calledOnce.should.equal(true);
        stubs['rekogFacesStub'].calledOnce.should.equal(true);
        stubs['rekogTextStub'].calledOnce.should.equal(true);
        stubs['rekogModStub'].calledOnce.should.equal(true);
        stubs['semanticEntitiesStub'].calledOnce.should.equal(true);
        done();
      });
    });

    it('Semantic decorator function should not be called if the caption isn\'t present but all others should', (done) => {
      _setSNS(NOTIFICATION_INPUT_2);
      lambda.handler(NOTIFICATION_INPUT_2, null, (err, res) => {
        should.not.exist(err);
        stubs['semanticEntitiesStub'].called.should.equal(false);
        stubs['rekogKeywordStub'].calledOnce.should.equal(true);
        stubs['rekogPeopleStub'].calledOnce.should.equal(true);
        stubs['rekogFacesStub'].calledOnce.should.equal(true);
        stubs['rekogTextStub'].calledOnce.should.equal(true);
        stubs['rekogModStub'].calledOnce.should.equal(true);
        done();
      });
    });

    it('The response JSON should match the expected', (done) => {
      _setSNS(NOTIFICATION_INPUT_1);
      let expectedResponse = {
        keywords: ["test"], people: ["test"], faces: ["test"], text: ["test"],
        adultContent: ["test"], semanticEntities:["test"]
      };
      lambda.handler(NOTIFICATION_INPUT_1, null, (err, res) => {
        should.not.exist(err);
        should.exist(res.extendedContent);
        res.extendedContent.should.deep.equal(expectedResponse);
        done();
      });
    });

  });
});

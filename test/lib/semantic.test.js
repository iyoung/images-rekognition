'use strict';

const AWS = require('aws-sdk');
const should = require('chai').should();
const sinon = require('sinon');

let sandbox, semantic;

describe('semantic', () => {

  before(function(done) {
    sandbox = sinon.sandbox.create();
    sandbox.stub(AWS, 'Comprehend').returns({
      detectEntities: (options, callback) => {
        return callback(null, {
          Labels: [
            {Confidence: 99.2, Name: "Road"},
            {Confidence: 99.1, Name: "Motorcycle"},
            {Confidence: 98.2, Name: "Car"}
          ]
        });
      }
    });
    semantic = require('../../lib/semantic');
    done();
  });

  after(function(done) {
    sandbox.restore();
    done();
  });

  it('should exist', function(done) {
    should.exist(semantic);
    done();
  });

  describe('decorateWithEntities()', function() {

    it('Should return error if no text provided', (done) => {
      let notificationPromise = semantic.decorateWithEntities();
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no text sent');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return error if no text provided', (done) => {
      let notificationPromise = semantic.decorateWithEntities('');
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no text sent');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return error if nothing but spaces provided', (done) => {
      let notificationPromise = semantic.decorateWithEntities('    ');
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no text sent');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return items if text provided', (done) => {
      let notificationPromise = semantic.decorateWithEntities('test text');
      notificationPromise.then((response) => {
        should.exist(response, 'Expected a response when text provided');
        response.Labels.length.should.equal(3);
        done();
      }).catch((err) => {
        should.not.exist(err, 'Expected no error when text provided');
        done();
      });
    });

  });

});

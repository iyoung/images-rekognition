'use strict';

const AWS = require('aws-sdk');
const chai = require('chai');
const should = require('chai').should();
const sinon = require('sinon');

const NOTIFICATION_INPUT_1 = require(`${__dirname}/../fixtures/pa-1-sns.input.json`);
let sandbox, rekog, message;

describe('rekog', () => {

  before(function(done) {
    sandbox = sinon.sandbox.create();
    message = JSON.parse(NOTIFICATION_INPUT_1.Records[0].Sns.Message);
    sandbox.stub(AWS, 'Rekognition').
      returns({
        detectLabels: (options, callback) => {
          return callback(null, {
            Labels: [
              {Confidence: 99.2, Name: "Road"},
              {Confidence: 99.1, Name: "Motorcycle"},
              {Confidence: 98.2, Name: "Car"}
            ]
          });
        },
        recognizeCelebrities: (options, callback) => {
         return callback(null, {CelebrityFaces: [{name: "Ian Young"}]});
        }
      });
    rekog = require('../../lib/rekog');
    done();
  });

  after(function(done) {
    sandbox.restore();
    done();
  });

  it('should exist', function(done) {
    should.exist(rekog);
    done();
  });

  describe('decorateWithKeywords()', function () {

    it ('Should return error if no image set', (done) => {
      let notificationPromise = rekog.decorateWithKeywords(message);
      notificationPromise.then((notification) => {
        should.not.exist(notification, 'Expected failure when no image set');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return notification with keywords if image set', (done) => {
      rekog.setImage('testBucket','testKey');
      rekog.decorateWithKeywords(message).then((notification) => {
        should.exist(notification.metadata.detectedKeywords);
        notification.metadata.detectedKeywords.length.should.equal(3);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('decorateWithPeople()', function() {

    it('Should return error if no image set', (done) => {
      let notificationPromise = rekog.decorateWithPeople(message);
      notificationPromise.then((notification) => {
        should.not.exist(notification, 'Expected failure when no image set');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return notification with celebrities if image set', (done) => {
      rekog.setImage('testBucket', 'testKey');
      rekog.decorateWithPeople(message).then((notification) => {
        should.exist(notification.metadata.detectedPersonInImage);
        notification.metadata.detectedPersonInImage.length.should.equal(1);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });


});

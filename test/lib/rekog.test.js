'use strict';

const AWS = require('aws-sdk');
const chai = require('chai');
const should = require('chai').should();
const sinon = require('sinon');

const NOTIFICATION_INPUT_1 = require(`${__dirname}/../fixtures/pa-1-sns.input.json`);
let sandbox, rekog;//, message;

describe('rekog', () => {

  before(function(done) {
    sandbox = sinon.sandbox.create();
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
        },
        detectFaces: (options, callback) => {
          return callback(null, {});
        },
        detectText: (options, callback) => {
          return callback(null, {});
        },
        detectModerationLabels: (options, callback) => {
          return callback(null, {});
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
      let notificationPromise = rekog.decorateWithKeywords();
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
      rekog.decorateWithKeywords().then((response) => {
        should.exist(response);
        response.length.should.equal(3);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('decorateWithPeople()', function() {

    it('Should return error if no image set', (done) => {
      let notificationPromise = rekog.decorateWithPeople();
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no image set');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return notification with celebrities if image set', (done) => {
      rekog.setImage('testBucket', 'testKey');
      rekog.decorateWithPeople().then((response) => {
        should.exist(response);
        response.length.should.equal(1);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('decorateWithFaces()', function() {

    it('Should return error if no image set', (done) => {
      let notificationPromise = rekog.decorateWithFaces();
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no image set');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return notification with faces and sentiment if image set', (done) => {
      rekog.setImage('testBucket', 'testKey');
      rekog.decorateWithFaces().then((response) => {
        should.exist(response);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('decorateWithDetectedText()', function() {

    it('Should return error if no image set', (done) => {
      let notificationPromise = rekog.decorateWithDetectedText();
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no image set');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return notification with found text if image set', (done) => {
      rekog.setImage('testBucket', 'testKey');
      rekog.decorateWithDetectedText().then((response) => {
        should.exist(response);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });

  describe('decorateWithModerationWarnings()', function() {

    it('Should return error if no image set', (done) => {
      let notificationPromise = rekog.decorateWithModerationWarnings();
      notificationPromise.then((response) => {
        should.not.exist(response, 'Expected failure when no image set');
        done();
      }).catch((err) => {
        should.exist(err);
        done();
      });
    });

    it('Should return notification with any adult content warnings if image set', (done) => {
      rekog.setImage('testBucket', 'testKey');
      rekog.decorateWithModerationWarnings().then((response) => {
        should.exist(response);
        done();
      }).catch((err) => {
        should.not.exist(err);
        done();
      });
    });

  });

});

'use strict';

const log = require('lambda-log');
const AWSUtils = require('@press-association/aws-utils');
const rekog = require('./lib/rekog');

const sns = new AWSUtils({region: process.env.AWS_DEFAULT_REGION}).SNS();

/**
 * Set metadata on lambda logger.
 *
 * @param notification
 * @returns {Promise.<T>}
 */
function setLogMetadata(notification) {
  log.config.meta.key = notification.asset.key;
  log.config.meta.bucket = notification.asset.bucket;
  log.config.meta.region = notification.asset.region;
  log.config.meta.contributor = notification.asset.contributor;
  return Promise.resolve(notification);
}

/**
 * Lambda: Images Rekognition
 *
 * For the provided notification decorate the metadata based on rekognition response to preview rendition.
 *
 * Input:  Event (typically relayed via an SNS Topic)
 * Output: SNS Topic
 *
 * @param event
 * @param context
 * @param callback
 */
exports.handler = (event, context, callback) => {
  let decoratedItem;

  sns.extractSNSNotification(event)
      .then(notification => setLogMetadata(notification))
      .then((notification) => {
        rekog.setImage(notification.asset.bucket, notification.asset.key);
        return notification;
      })
      .then(notification => rekog.decorateWithKeywords(notification))
      .then(notification => rekog.decorateWithPeople(notification))
      .then(notification => decoratedItem = notification.metadata)
      .then(item => sns.publish({message: JSON.stringify(item), targetArn: process.env.PUBLISH_SNS}))
      .then((res) => {
        log.info('metadata decorated successfully', {decoratedItem: decoratedItem});
        return callback(null, decoratedItem);
      })
      .catch((err) => {
        log.error('error decorating metadata', {err, event, context});
        return callback(err);
      });
};

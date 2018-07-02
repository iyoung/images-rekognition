'use strict';
const AWS = require('aws-sdk');
let imageS3Object, rekognition;
const MAX_LABELS = 20;
const MIN_CONFIDENCE = 90;

class Rekog {

  constructor() {
    rekognition = new AWS.Rekognition({region: process.env.AWS_DEFAULT_REGION});
  }

  /**
   * Extracts keywords from the image
   */
  decorateWithKeywords(notification) {

    return new Promise((resolve,reject) => {
      if (imageS3Object) {
        let options = {
          Image: imageS3Object,
          MaxLabels: MAX_LABELS,
          MinConfidence: MIN_CONFIDENCE
        };
        console.log(options);
        rekognition.detectLabels(options, (err, response) => {
          if (err) {
            reject("Error detecting labels: " + err.message);
          }
          if (response && response.Labels) {
            notification.metadata.detectedKeywords = [];
            response.Labels.forEach((label) => {
              notification.metadata.detectedKeywords.push(label.Name);
            });
            resolve(notification);
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  decorateWithPeople(notification) {

    return new Promise((resolve, reject) => {
      if (imageS3Object) {
        let options = {
          Image: imageS3Object
        };
        rekognition.recognizeCelebrities(options, (err, response) => {
          if (err) {
            reject("Error detecting celebrities: " + err.message);
          }
          if (response && response.CelebrityFaces) {
            notification.metadata.detectedPersonInImage = [];
            response.CelebrityFaces.forEach((celebrity) => {
              notification.metadata.detectedPersonInImage.push(celebrity.Name);
            });
            resolve(notification);
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  setImage(bucket, key) {
    // sets the image to act on by generating unique ref to it
    if (!bucket || !key){
      return null;
    }
    imageS3Object = {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    };
  }
}

module.exports = new Rekog();

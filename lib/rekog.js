'use strict';
const AWS = require('aws-sdk');
let imageS3Object, rekognition;
const MAX_LABELS = 20;
const MIN_CONFIDENCE = 60;
const MIN_CONFIDENCE_MODERATION = 1.0;

class Rekog {

  constructor() {
    rekognition = new AWS.Rekognition({region: process.env.AWS_DEFAULT_REGION});
  }

  /**
   * Fetch the keywords found via visual analysis of the image
   *
   * Output: Array of keywords
   *
   */
  decorateWithKeywords() {

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
            resolve(response.Labels);
          } else {
            reject("No labels found");
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  /**
   * Fetch the celebrities found via visual analysis of the image
   *
   * Output: Array of celebrities
   *
   */
  decorateWithPeople() {

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
            resolve(response.CelebrityFaces);
          } else {
            reject("No celebrities found");
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  /**
   * Fetch the faces found via visual analysis of the image
   *
   * Output: Array of faces
   *
   */
  decorateWithFaces() {

    return new Promise((resolve, reject) => {
      if (imageS3Object) {
        let options = {
          Image: imageS3Object
        };
        rekognition.detectFaces(options, (err, response) => {
          if (err) {
            reject("Error detecting faces: " + err.message);
          }
          if (response) {
            resolve(response);
          } else {
            reject("No faces found");
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  /**
   * Fetch the text found via visual analysis of the image
   *
   * Output: Array of words / phrases
   *
   */
  decorateWithDetectedText() {

    return new Promise((resolve, reject) => {
      if (imageS3Object) {
        let options = {
          Image: imageS3Object
        };
        rekognition.detectText(options, (err, response) => {
          if (err) {
            reject("Error detecting text in image: " + err.message);
          }
          if (response) {
            resolve(response);
          } else {
            reject("No text found");
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  /**
   * Fetch the adult content found via visual analysis of the image
   *
   * Output: Array of adult content
   *
   */
  decorateWithModerationWarnings() {

    return new Promise((resolve, reject) => {
      if (imageS3Object) {
        let options = {
          Image: imageS3Object,
          MinConfidence: MIN_CONFIDENCE_MODERATION
        };
        rekognition.detectModerationLabels(options, (err, response) => {
          if (err) {
            reject("Error detecting moderation warnings in image: " + err.message);
          }
          if (response) {
            resolve(response);
          } else {
            reject("No moderation warnings found");
          }
        });
      } else {
        reject("No image set");
      }
    });
  }

  /**
   * Set the image for analysis from the S3 bucket
   *
   * Output: null
   * @param bucket
   * @param key
   */
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

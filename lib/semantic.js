'use strict';
const AWS = require('aws-sdk');
const EMPTY = new RegExp('/^\s+?$/');
let comprehend;

class Semantic {
  constructor() {
    comprehend = new AWS.Comprehend({region: process.env.AWS_DEFAULT_REGION});
  }

  /**
   * Fetch the semantic entities found in text
   *
   * Input:  String to analyse
   * Output: Array of entities
   *
   * @param text
   */
  decorateWithEntities(text) {
    if (!text || EMPTY.test(text)){
      return Promise.reject("No text provided");
    }
    return new Promise((resolve, reject) => {
      let params = {
        LanguageCode: 'en',
        Text: text
      };
      comprehend.detectEntities(params, (err, response) => {
        if (err) {
          reject("Error detecting entities: " + err.message);
        }
        if (response) {
          resolve(response);
        } else {
          reject("No entities found");
        }
      });
    });
  }

}

module.exports = new Semantic();

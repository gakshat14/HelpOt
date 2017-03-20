'use strict';

var request = require('request');
var dotenv = require('dotenv');
dotenv.load();

var q;
var qnaId = process.env.QNA_MAKER_ID

var headers = {
    'Content-Type' : 'application/json',
    'Ocp-Apim-Subscription-Key' : qnaId
}
module.exports = {
    sendData : function (q, callback) {
        var answer = '';
        var options = {
            url : 'https://westus.api.cognitive.microsoft.com/qnamaker/v1.0/knowledgebases/83ac2582-d337-4fa8-9e32-8db60cd6cfb0/generateAnswer',
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ question : q})
        }
        
        request.post(options, function (error, response, body) {
            callback(JSON.parse(body));
        });
    }//, 
    // sendEmail : function (q, callback) {
        
    // }
}


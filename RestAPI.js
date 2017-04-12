'use strict';

var request = require('request');
var dotenv = require('dotenv');
var emailjs = require('emailjs');
dotenv.load();

var q;
var qnaId = process.env.QNA_MAKER_ID

var headers = {
    'Content-Type' : 'application/json',
    'Ocp-Apim-Subscription-Key' : qnaId
}

var emailServer = emailjs.server.connect({
    user : 'helpot.ts@gmail.com',
    password: 'TechShanty',
    host: 'smtp.gmail.com',
    ssl: true
});

module.exports = {
    sendData : function (q, callback) {
        var answer = '';
        var options = {
            url : 'https://westus.api.cognitive.microsoft.com/qnamaker/v1.0/knowledgebases/086fb601-679e-48ef-b5e2-a287131f552f/generateAnswer',
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ question : q})
        }
        
        request.post(options, function (error, response, body) {
            callback(JSON.parse(body));
        });
    }, 

    sendEmail: function name(query, emailID, callback) {
        var message = {
            text:  "Conversation " + query + " sent by user: " + emailID,
            from: 'HelpOt<helpot.ts@gmail.com>',
            to: 'TechShanty<techshanty@gmail.com>',
            cc: "HelpingO<support@helpingo.com>",
            subject: "Support Needed"
        };
        emailServer.send(message, function (err, data) {
            console.log(err);
            console.log(data);
            callback(err, data);
        });
    }
}




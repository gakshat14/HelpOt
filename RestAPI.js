'use strict';
//loading request module
var request = require('request');
var dotenv = require('dotenv');

//loading emailjs module which provide email functionality
var emailjs = require('emailjs');
dotenv.load();

var q;
//loading qna credentials
var qnaId = process.env.QNA_MAKER_ID

//setting headers for the post request
var headers = {
    'Content-Type' : 'application/json',
    'Ocp-Apim-Subscription-Key' : qnaId
}

//defining the email server
var emailServer = emailjs.server.connect({
    user : 'helpot.ts@gmail.com',
    password: 'SuperDuperChief',
    host: 'smtp.gmail.com',
    port:587,
    tls: true
});

//exporting module so that it can be used by main bot 
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
            //after receiving response pass the data back
            //by a callback function
            callback(JSON.parse(body));
        });
    }, 
    //sending EMail to the team
    sendEmail: function name(query, emailID, callback) {
        var message = {
            text:  "Conversation " + query + " sent by user: " + emailID,
            from: 'HelpOt<helpot.ts@gmail.com>',
            to: 'TechShanty<techshanty@gmail.com>',
            cc: "HelpingO<support@helpingo.com>",
            subject: "Support Needed"
        };
        emailServer.send(message, function (err, data) {
            //console.log(err);
            //console.log(data);
            callback(err, data);
        });
    }
}




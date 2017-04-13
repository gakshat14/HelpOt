'use strict';
//refrencing  module
var builder = require ('botbuilder');
var restify = require ('restify');
var dotenv = require('dotenv');
var path = require('path');
var winston = require('winston');
var fs = require('fs');

//custom module
var qna = require('./RestAPI');

//loading
dotenv.load();

var conversationMess = {'Messages':[],
                        'User': []};

var emailValidator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

var dial = [];

dial[0] = "Oh no! I didn't get it";
dial[1] = "Let's just talk about HelpingO";
dial[2] = "I think I'm fried by your questions.";
dial[3] = "Let's try something new, let's create a companion profile";

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var model = process.env.LUIS;
var stuck;
var nod;
var emailID;
var fileName;
var answered;

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

fileName = path.join(__dirname, 'user.log');

var bot = new builder.UniversalBot(connector, function (session) {
    if(!session.userData.name){
        console.log(session.message.address.user);
        session.beginDialog('/getDetails');
    } else {
        session.sendTyping();
        session.send('Hello %(name)s! I\'m HelpOt your support virtual assistant. Welcome back to HelpingO. How can I help you today?', session.userData);
        session.beginDialog('/next', lDialog);
    }
});

var logUserConversation = function (event) {
    /*console.log(fileName);
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({filename: fileName})
        ]
    })*/
    conversationMess.Messages[conversationMess.Messages.length] = 'message: ' + event.text;
    conversationMess.User[0] = ' user: ' + event.address.user.id;
    //logger.log('info', 'message: ' + event.text + ' user: ' + event.address.user.id);
}

// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});

bot.set('persistConversationData', true);

bot.dialog('/getDetails', function (session) {
    session.userData.name = session.message.address.user.name;
    session.send('Hi %(name)s! I\'m HelpOt your Virtual Support Assistant. Welcome to HelpingO! I can help you with all the problems related to HelpingO.', session.userData);
    session.beginDialog('/next', lDialog);
});

var recognizer = new builder.LuisRecognizer(model);
var lDialog = new builder.IntentDialog({recognizers:[recognizer]});
bot.dialog('/next', lDialog);

lDialog.matches('contactSupport', [function (session, args, next) {
    session.sendTyping();
    if(args.entities.length > 0){
        session.privateConversationData.entity = args.entities[0].entity;
    }
    session.conversationData.message = session.message.text;
    var sendQuestion = session.message.text;
    qna.sendData(sendQuestion, function (data) {
        console.log(data);
        if(data.Error){
            session.send('I\'m sorry. I didn\'t understand that. Please rephrase your query');
            answered = true;
            session.replaceDialog('/next', lDialog);
        } else if(data.score == 0){
            session.send('I lost my sword! try again');
            answered = true;
            session.replaceDialog('/next', lDialog);
        } else {
            session.send(data.answer);
            answered = true;
            session.beginDialog('/next');
        }
    });
}])

.matches('thankYou', function (session, args, next) {
    session.sendTyping();
    if(nod){
        session.send('Bbye!');
        nod = false;
        session.endConversation();
    } else if(stuck){
        session.send(' I\'\m still here if you need anythying. Just say Hi! to wake me up again');
        stuck = false;
        session.endConversation();
    } else if(!answered){
        session.send('But, you didn\'t ask me anything go ahead ask me something');
        session.beginDialog('/next');
    } else if( !stuck && !nod ){
        session.send('Great! Good to know that I was able to help you. I\'\m still here if you need anythying. Just say Hi!');
        nod = true;
        session.beginDialog('/next');
    }
})

.matches('stuck', function (session, args, next) {
    session.sendTyping();
    session.send('Sorry, for the inconvinience caused. I\'ll be sending an email to my team with your query and will get back to you ASAP');
    stuck = true;
    session.beginDialog('/getEmail');
})

.onDefault('/random');

bot.dialog('/random', function(session){
    session.sendTyping();
    var rand = Math.floor((Math.random()*3) + 1);
    console
    session.send(dial[rand]);
    session.endDialog();
});

bot.dialog('/getEmail', [function (session, args, next) {
    session.sendTyping();
    if( !session.userData.email ) {
        builder.Prompts.text(session, "What is your email-id?");
    } else {
        next();
    }
},
    function (session, results, next) {
        session.sendTyping();
        if( results.response ){
            if(emailValidator.test(results.response)){
                session.userData.email = results.response;
                emailID = session.userData.email;
                session.sendTyping();
                qna.sendEmail(JSON.stringify(conversationMess), emailID, function (data) {
                    session.send('I have sent an email to the team');
                });
                stuck = true;
                session.beginDialog('/next');
            } else {
                session.replaceDialog('/getEmail');
            }
        } else if( !results.response || session.userData.email){
            emailID = session.userData.email;
            session.sendTyping();
            qna.sendEmail(JSON.stringify(conversationMess), emailID, function (err, data) {
                if(err){
                    session.send('I was not able to send an email to my team, please send your query to support@helpingo.com.');
                } else {
                session.send('I have sent an email to the team');
                }
            });
            stuck = true;
            session.beginDialog('/next');
        } else {
            session.replaceDialog('/getEmail');
        }
    }
]);

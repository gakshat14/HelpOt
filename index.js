'use strict';
//refrencing  module

//importing Microsoft Bot module
var builder = require ('botbuilder');

//importing retify to REST server 
var restify = require ('restify');

//importing module for reading .env file
//which stores all the credentials
var dotenv = require('dotenv');

//importing path module which makes
//defining and receiving path independent of OS
var path = require('path');

//importing winston log module
var winston = require('winston');

//importing fs module to 
//access,write and read Log files
var fs = require('fs');

//custom module
//consisting of Email functionality as well as QNA maker functionality
var qna = require('./RestAPI');

//Reading .env file
dotenv.load();

//initialising variable for logging conversation 
//to send an email to support as well as to chief
var conversationMess = {'Messages':[],
                        'User': []};

//defining regex expression for validating email id
var emailValidator = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

//initialising random genrated messages if bot fils to understand what user is asking
var dial = [];

dial[0] = "Oh no! I didn't get it";
dial[1] = "Let's just talk about HelpingO";
dial[2] = "I didn't get it, try to rephrase it.";
dial[3] = "Let's explore HelpingO App";

//creating Restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//creating connector service which will be main component
var connector = new builder.ChatConnector({
    //retrieving APP ID and Password from file
    //appId: process.env.MICROSOFT_APP_ID,
    //appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//reading LUIS endpoint from file
var model = process.env.LUIS;

//declaring other important variable
var stuck;
var nod;
var emailID;
var fileName;
var answered;

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

//creating a file which will be used for logging
fileName = path.join(__dirname, 'user.log');

//defining bot which will contain all the dialogs and everything 
var bot = new builder.UniversalBot(connector, function (session) {
    //checking if we have username in bot's memory
    //if not then start getDetails dialog
    if(!session.userData.name){
        session.beginDialog('/getDetails');
    } else {
        //sending typing and saying hello
        session.sendTyping();
        session.send('Hello %(name)s! I\'m HelpOt your support virtual assistant. Welcome back to HelpingO. How can I help you today?', session.userData);
        //begining LUIS dialog
        session.beginDialog('/next', lDialog);
    }
});

//function for logging user conversation
var logUserConversation = function (event) {
    //initializing winston library
    //creating logger
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({filename: fileName})
        ]
    })
    
    //storing conversation for sending an email to the team
    conversationMess.Messages[conversationMess.Messages.length] = 'message: ' + event.text;
    conversationMess.User[0] = ' user: ' + event.address.user.id;
    //logging conversation in the user.log
    logger.log('info', 'message: ' + event.text + ' user: ' + event.address.user.id);
}

// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        //for sending message to the user after logging
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});

//when a new conversation is started then
//begin dialog instaed of for waiting for a hi
// bot.on('conversationUpdate', function (message) {
//     if (message.membersAdded) {
//         message.membersAdded.forEach(function (identity) {
//             if (identity.id === message.address.bot.id) {
//                 bot.beginDialog(message.address, '/');
//             }
//         });
//     }
// });

//setting bot memory state like conversation data to true
//so that we can store it
bot.set('persistConversationData', true);

//dialog definition for getDetails
bot.dialog('/getDetails', function (session) {
    //saving userName to bot's memory so that it can be used
    //if a user visits us again
    session.userData.name = session.message.address.user.name;
    session.send('Hi %(name)s! I\'m HelpOt your Virtual Support Assistant. Welcome to HelpingO! I can help you with all the problems related to HelpingO.', session.userData);
    //begining LUIS dialog
    session.beginDialog('/next', lDialog);
});

//defining recogniser which is LUIS
//and passing the LUIS string 
var recognizer = new builder.LuisRecognizer(model);
var lDialog = new builder.IntentDialog({recognizers:[recognizer]});

//body of /next
bot.dialog('/next', lDialog);

//if LUIS return contactSupport intent then run this
lDialog.matches('contactSupport', [function (session, args, next) {
    session.sendTyping();
    //if LUIS is returning entity then store it
    if(args.entities.length > 0){
        session.privateConversationData.entity = args.entities[0].entity;
    }

    //storing user query
    session.conversationData.message = session.message.text;

    //getiing question
    var sendQuestion = session.message.text;

    //calling senData method from qna Module
    qna.sendData(sendQuestion, function (data) {
        console.log(data);
        if(data.Error){
            session.send('I\'m sorry. I didn\'t understand that. Please rephrase your query');
            answered = true;
            //restarting LUIS dialog if query goes unanswered
            session.replaceDialog('/next', lDialog);
        } else if(data.score == 0){
            session.send('I think I\'m lost, try asking me again');
            answered = true;
            //restarting LUIS dialog if query goes unanswered
            session.replaceDialog('/next', lDialog);
        } else {
            //if everything goes well show the answer to the user
            session.send(data.answer);
            //setting answered true so that bot knows that user has asked at least one answer
            answered = true;
            //restarting  LUIS dialog and waiting for user to ask something
            session.beginDialog('/next');
        }
    });
}])

//run this when LUIS returns thankYou as an intent
.matches('thankYou', function (session, args, next) {
    //showing bot is typing
    //so that user knows bot is doing something
    session.sendTyping();
    //if user says ok after a message then
    if(nod){
        session.send('Bbye!');
        nod = false;
        //ending conversation withuser and if he says Hi then start a new conversation
        session.endConversation();
    //if user was stuck then show this
    } else if(stuck){
        session.send(' I\'\m still here if you need anythying. Just say Hi! to wake me up again');
        stuck = false;
        session.endConversation();
    //if a user din't ask anything and said bye then show this
    } else if(!answered){
        session.send('But, you didn\'t ask me anything go ahead ask me something');
        session.beginDialog('/next');
    //if a user was satisfied with everything then send this
    } else if( !stuck && !nod ){
        session.send('Great! Good to know that I was able to help you. I\'\m still here if you need anythying. Just say Hi!');
        //setting tht we have answered and user hwas satisfied
        nod = true;
        //waiting for user to say HI
        session.beginDialog('/next');
    }
})

//if a user is stuck and show say that it was not that he was looking for
//then LUIS will send intent as stuck
.matches('stuck', function (session, args, next) {
    session.sendTyping();
    session.send('Sorry, for the inconvinience caused. I\'ll be sending an email to my team with your query and will get back to you ASAP');
    stuck = true;
    //getting user email id
    session.beginDialog('/getEmail');
})

//if nothing matches then show a random message from dial array
.onDefault('/random');

//body of random dialog
bot.dialog('/random', function(session){
    session.sendTyping();
    //generating random number
    var rand = Math.floor((Math.random()*3) + 1);
    session.send(dial[rand]);
    //ending dialog and returning to previous dialog that is LUIS dialog
    session.endDialog();
});

//dialog for getting users email id
//for providing further support
bot.dialog('/getEmail', [function (session, args, next) {
    session.sendTyping();
    //checking session.userData if we have email then no need to ask if not then
    //prompt user to enter one
    if( !session.userData.email ) {
        builder.Prompts.text(session, "What is your email-id?");
    } else {
        //if we have then go on to next waterfell step
        next();
    }
},
    function (session, results, next) {
        session.sendTyping();
        //if we received a response then
        if( results.response ){
            //check the email whether its of valid format or not
            if(emailValidator.test(results.response)){
                //save the email id
                session.userData.email = results.response;
                emailID = session.userData.email;
                session.sendTyping();
                //passing email and conversation to sendEmail function and sending email
                qna.sendEmail(JSON.stringify(conversationMess), emailID, function (err, data) {
                    //console.log(err);
                    //console.log(data);
                    //if we are receiving error then
                    if(err != null || err != undefined){
                        session.send('I was not able to send an email to my team, please send your query to support@helpingo.com.');
                    //otherwise
                    } else {
                        session.send('I have sent an email to the team');
                    }
                });
                //user was stuck
                stuck = true;
                //beginning LUIS dialog
                session.beginDialog('/next');
            } else {
                //if email didn't match then prompt user again to enter a valid email
                session.replaceDialog('/getEmail');
            }
        //if we didn't receive any response then
        } else if( !results.response || session.userData.email){
            emailID = session.userData.email;
            session.sendTyping();
            qna.sendEmail(JSON.stringify(conversationMess), emailID, function (err, data) {
                if(err != null || err != undefined){
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

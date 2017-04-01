'use strict';
//refrencing module
var builder = require ('botbuilder');
var restify = require ('restify');
var dotenv = require('dotenv');
var emailjs = require('emailjs');
var path = require('path');
var winston = require('winston');
var fs = require('fs');

//custom module
var qna = require('./RestAPI');

dotenv.load();

var conversationMess = {'Messages':[],
                        'User': []};

var dial = [];

dial[0] = "Oh no! I didn't get it";
dial[1] = "Let's just talk about HelpingO";
dial[2] = "I think I'm fried by your questions.";
dial[3] = "Let's try something new, let's create a companion profile";

//creating email client
var emailServer = emailjs.server.connect({
    user : 'helpot.ts@gmail.com',
    password: 'TechShanty',
    host: 'smtp.gmail.com',
    ssl: true
});

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var model = process.env.LUIS;
var stuck;
var nod;
var emailID;
var fileName;

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    if(!session.userData.name){
        console.log(session.message.address.user.id);
        session.beginDialog('/getDetails');
    } else { 
        session.send('Hello %(name)s! Welcome back to HelpingO. How can I help you today?', session.userData);
        session.beginDialog('/next', lDialog);
    }
});

var logUserConversation = function (event) {
    fileName = path.join(__dirname, 'user.log');

    console.log(fileName);

    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({filename: fileName})
        ]
    })
    conversationMess.Messages[conversationMess.Messages.length] = 'message: ' + event.text; 
    conversationMess.User[0] = ' user: ' + event.address.user.id;
    logger.log('info', 'message: ' + event.text + ' user: ' + event.address.user.id);
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

bot.dialog('/getDetails', [
    function (session, args, next) {
        if (!session.dialogData.name) {
            builder.Prompts.text(session, "Hey! I'm HelpOt. What's your name?");
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            session.userData.name = results.response;
        } else if (!session.userData.name){
            session.replaceDialog('/getDetails')
        }
        session.send('Hello %(name)s! I\'\m HelpOt, Welcome to HelpingO! How can I help you today?', session.userData);
        session.beginDialog('/next', lDialog);
    }
]);

var recognizer = new builder.LuisRecognizer(model);
var lDialog = new builder.IntentDialog({recognizers:[recognizer]});
bot.dialog('/next', lDialog);

lDialog.matches('contactSupport', [function (session, args, next) {
    session.sendTyping();
    if(args.entities != []){
        session.privateConversationData.entity = args.entities[0].entity;
    }
    session.conversationData.message = session.message.text;
    var sendQuestion = session.message.text;
    qna.sendData(sendQuestion, function (data) {
        var score = data.score;
        if(score == 0){
            session.send('I lost my sword! try again');
            session.replaceDialog('/next', lDialog);
        } else {
            session.send(data.answer);
            session.beginDialog('/next');
        }
    });
}])

.matches('feedback', [function (session, args, next) {
    session.send('Hello Mohit');
}])

.matches('thankYou', function (session, args, next) {
    if(nod){
        session.send('Bbye!');
        nod = false;
        session.endConversation();
    } else if(stuck){
        session.send(' I\'\m still here if you need anythying. Just say Hi! to wake me up again');
        stuck = false;
        session.endConversation();
    } else if( !stuck && !nod ){
        session.send('Great! Good to know that I was able to help you. I\'\m still here if you need anythying. Just say Hi!');
        nod = true;
        session.beginDialog('/next');
    }
})

.matches('stuck', function (session, args, next) {
    session.send('Sorry, for the inconvinience caused. I\'ll be sending an email to my team with your query and will get back to you ASAP');
    stuck = true;
    session.beginDialog('/getEmail');
})

.onDefault('/random');

bot.dialog('/random', function(session){
    var rand = Math.floor((Math.random()*4) + 1);
    session.send(dial[rand]);
    session.endDialog();
});

bot.dialog('/getEmail', [function (session, args, next) {
    if( !session.userData.email ) {
        builder.Prompts.text(session, "What is your Email-ID");
    } else {
        next();
    }
}, 
    function (session, results, next) {
        if( results.response ){
            session.userData.email = results.response;
            emailID = session.userData.email;
            sendEmail(JSON.stringify(conversationMess));
            session.send('I have sent an email to the team');
            stuck = true;
            session.beginDialog('/next');
        } else if( !results.response || session.userData.email){
            emailID = session.userData.email;
            sendEmail(JSON.stringify(conversationMess));
            session.send('I have sent an email to the team');
            stuck = true;
            session.beginDialog('/next');
        } else {
            session.replaceDialog('/getEmail');
        } 
    }
])

var sendEmail = function (body) {
    var message = {
        text:  "Conversation " + body + " sent by user: " + emailID,
        from: 'HelpOt<helpot.ts@gmail.com>',
        to: 'TechShanty<techshanty@gmail.com>',
        cc: "HelpingO<support@helpingo.com>",
        subject: "Support Needed"
    };
    emailServer.send(message, function (err, data) {
        console.log(err);
        console.log(data);
    });
}
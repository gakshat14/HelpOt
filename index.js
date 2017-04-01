var builder = require ('botbuilder');
var restify = require ('restify');
var dotenv = require('dotenv');
var qna = require('./RestAPI');
dotenv.load();

var dial = [];

<<<<<<< HEAD

=======
>>>>>>> b449543bf9b5133ce3a5d999f02b62f52c93adf8
dial[0] = "Oh no! I didn't get it";
dial[1] = "Let's just talk about HelpingO";
dial[2] = "I think I'm fried by your questions.";
dial[3] = "Let's try something new, let's create a companion profile";

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
});

<<<<<<< HEAD
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/6abfbb49-be88-4630-b26e-44122d91fe62?subscription-key=2ad3f4e145284a70a39865fb107b3ff8&staging=true&verbose=false&q=';
var userName = '';
=======
var model = process.env.LUIS;
var userName = '';
var stuck;
var nod;
>>>>>>> b449543bf9b5133ce3a5d999f02b62f52c93adf8

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    if(!session.userData.name){
<<<<<<< HEAD
        session.beginDialog('/next', lDialog);
    } else { 
        session.send('Hello %(name)s! Welcome back to HelpingO. How can I help you today?', session.userData);
        session.beginDialog('/next', lDialog);
=======
        session.beginDialog('/getDetails');
    } else { 
        session.send('Hello %(name)s! Welcome back to HelpingO. How can I help you today?', session.userData);
        session.beginDialog('/next', lDialog);
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
>>>>>>> b449543bf9b5133ce3a5d999f02b62f52c93adf8
    }
});

<<<<<<< HEAD
// bot.set('persistConversationData', true);

// bot.dialog('/getDetails', [
//     function (session, args, next) {
//         if (!session.dialogData.name) {
//             builder.Prompts.text(session, "Hey! I'm HelpOt. What's your name?");
//         } else {
//             next();
//         }
//     },
//     function (session, results) {
//         if (results.response) {
//             session.userData.name = results.response;
//         } else if (!session.userData.name){
//             session.replaceDialog('/getDetails')
//         }
//         session.send('Hello %(name)s! Welcome to HelpingO! How can I help you today?', session.userData);
//         session.beginDialog('/next', lDialog);
        
//     }
// ]);

var recognizer = new builder.LuisRecognizer(model);
var lDialog = new builder.IntentDialog({recognizers:[recognizer]});
bot.dialog('/next', lDialog);

lDialog.matches('contactSupport', [function (session, args, next) {
    var entity = builder.EntityRecognizer.findEntity(args.entities, 'change colour');
    console.log(entity);
    //console.log(entity[0].entities);
    // var sendQuestion = session.message.text;
    // session.sendTyping();
    // qna.sendData(sendQuestion, function (data) {
    //     var score = data.score;
    //     if(score == 0){
    //         session.endDialog('I lost my sword! try again');
    //     } else {
    //         session.endDialog(data.answer);
    //     }
    // });
=======
var recognizer = new builder.LuisRecognizer(model);
var lDialog = new builder.IntentDialog({recognizers:[recognizer]});
bot.dialog('/next', lDialog);

lDialog.matches('contactSupport', [function (session, args, next) {
    session.sendTyping();
    session.privateConversationData.entity = args.entities[0].entity;
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
>>>>>>> b449543bf9b5133ce3a5d999f02b62f52c93adf8
}])

.matches('feedback', [function (session, args, next) {
    session.send('Hello Mohit');
}])
<<<<<<< HEAD

.onDefault('/random');
=======

.matches('thankYou', function (session, args, next) {
    if(nod){
        session.send('Bbye!');
        nod = false;
        session.endConversation();
    } else if(stuck){
        session.send(' I\'\m still here if you need anythying. Just say Hi! to wake me up again');
        stuck = false;
        session.endConversation();
    } else if( !stuck ){
        session.send('Great! Good to know that I was able to help you. I\'\m still here if you need anythying. Just say Hi!');
        nod = true;
        session.beginDialog('/next');
    }
})

.matches('stuck', function (session, args, next) {
    session.send('Sorry, for the inconvinience caused. we are looking into the matter and will get back to you ASAP');
    stuck = true;
    session.beginDialog('/next');
})
>>>>>>> b449543bf9b5133ce3a5d999f02b62f52c93adf8

.onDefault('/random');

bot.dialog('/random', function(session){
    var rand = Math.floor((Math.random()*4) + 1);
    session.send(dial[rand]);
    session.endDialog();
<<<<<<< HEAD
})
=======
});
>>>>>>> b449543bf9b5133ce3a5d999f02b62f52c93adf8

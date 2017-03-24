var builder = require ('botbuilder');
var restify = require ('restify');
var dotenv = require('dotenv');
var qna = require('./RestAPI');
dotenv.load();

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
var userName = '';
var stuck;
var nod;

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    if(!session.userData.name){
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
    }
]);

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

.onDefault('/random');

bot.dialog('/random', function(session){
    var rand = Math.floor((Math.random()*4) + 1);
    session.send(dial[rand]);
    session.endDialog();
});
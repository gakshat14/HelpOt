var builder = require ('botbuilder');
var restify = require ('restify');
var dotenv = require('dotenv');
var qna = require('./RestAPI');
dotenv.load();

var dial = [];


dial[0] = "Oh no! I didn't get it";
dial[1] = "Let's just talk about HelpingO";
dial[2] = "HelpOt can help you with\n 1. Contacting Support\n 2. Submitting Feedback\n 3. Searching Companions. \n\nfor Contacting Support enter #contact <your message> \n for feedback enter #feedback <your message>\n for Searching Companion enter #companion <your message>\n";
dial[3] = "I think I'm fried by your questions.";
dial[4] = "Let's try something new, let's create a companion profile";

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

var connector = new builder.ChatConnector({
    // appId: process.env.MICROSOFT_APP_ID,
    // appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/6abfbb49-be88-4630-b26e-44122d91fe62?subscription-key=2ad3f4e145284a70a39865fb107b3ff8&staging=true&verbose=false&q=';
var userName = '';

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    if(!session.userData.name){
        session.beginDialog('/next', lDialog);
    } else { 
        session.send('Hello %(name)s! Welcome back to HelpingO. How can I help you today?', session.userData);
        session.beginDialog('/next', lDialog);
    }
});

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
}])

.matches('feedback', [function (session, args, next) {
    session.send('Hello Mohit');
}])

.onDefault('/random');

bot.dialog('/random', function(session){
    var rand = Math.floor((Math.random()*5) + 1);
    session.send(dial[rand]);
    session.endDialog();
})
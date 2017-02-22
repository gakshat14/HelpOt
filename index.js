var builder = require ('botbuilder');
var restify = require ('restify');
var dotenv = require('dotenv');
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
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);

server.use(restify.queryParser());
server.post('api/messages', connector.listen());

bot.dialog('/', [
    function (session) {
        session.beginDialog('/getDetails', session.userData.profile);
    },
    function (session, results) {
        session.userData.name = results.response;
        session.send("Hello %(name)s! Welcome to HelpingO. HelpOt can help you with all of HelpingO!", session.userData);
        session.beginDialog('/next', intents);
    }
]);

bot.dialog('/getDetails', [
    function (session, args, next) {
        session.dialogData = args || {};
        if (!session.dialogData.name) {
            builder.Prompts.text(session, "Hey! I'm HelpOt. What's your name?");    
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.name = results.response;
        }
        session.endDialogWithResult({response: session.dialogData});
    }
]);

var intents = new builder.IntentDialog();
bot.dialog('/next', intents);

intents.onBegin(function (session, args, next) {
    session.send(dial[2]);
    next();
});

intents.matches(/^#contact/i, '/contactSupport')
       .matches(/^#feedback/i, '/feedbackHelpingO')
       .matches(/^#companion/i, '/searchCompanion')
       .onDefault('/random');

bot.dialog('/contactSupport', function (session) {
    session.send("Searching for user");
    session.endDialog();
})

bot.dialog('/feedbackHelpingO', function (session) {
    session.send("Searching for feedback");
    session.endDialog();
})

bot.dialog('/searchCompanion', function (session) {
    session.send("Searching for companion");
    session.endDialog();
})

bot.dialog('/random', function(session){
    var rand = Math.floor((Math.random()*5) + 1);
    session.send(dial[rand]);
    session.endDialog();
})

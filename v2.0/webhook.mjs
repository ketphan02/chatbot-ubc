import dotenv from 'dotenv';
dotenv.config(); // Environment: Heroku

import express from 'express';
import bodyParser from 'body-parser';
import request from 'request';
import mongodb from 'mongodb';
import { MATCH } from './match.mjs';
import { menuButton, GetStartedButton } from './persistent_menu.mjs';


export { WEBHOOK, callSendAPI };

const app = express();
const port = process.env.PORT || 27017;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // get this from Heroku

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:" + port.toString() + "/chatible-ubc";

const MANUAL = "[UBC CHATBOT]\nWELCOME TO UBC CHAT\n1. To start, type 'Start' or select Start in the menu below.\n2. To disconnect with the person you are talking to, type 'end chat' or choose End Chat option in the menu below.\n\n(!!!): It may take some time to find a person for you so please wait!"

function WEBHOOK()
{
    app.use(bodyParser.json());
    app.use(express.urlencoded({ extended: false }));

    app.listen(port , () => console.log('listening on port ' + port.toString()));

    // APP POST
    

    app.post('/', (req, res) =>
    {
        const body = req.body;

        if (body.object === 'page')
        {
            GetStartedButton(res);
            menuButton();
            if (body.entry && body.entry.length <= 0) return;

            /*----GET MESSAGE AND PRINT TO CONSOLE----*/
            body.entry.forEach((entry) =>
            {
                entry.messaging.forEach((event) =>
                {
                    const sender_id = event.sender.id;

                    if (event.postback && event.postback.payload == "GET_STARTED")
                    {
                        callSendAPI(sender_id, MANUAL);
                    }
                    else if (event.message || event.postback)
                    {
                        let msg = "";
                        if (event.message) msg = event.message.text;
                        else msg = event.postback.title;

                        addData(sender_id, msg);
                    }

                });
            });

            res.status(200).send('RECIEVED');
        }
        else res.sendStatus(404);
    });

    // APP GET
    app.get('/', (req, res) =>
    {
        const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token)
        {
            if (mode === 'subscribe' && token === VERIFY_TOKEN)
            {
                console.log('VERIFIED');
                res.status(200).send(challenge);
            }
            else res.sendStatus(403);
        }
    });
}

/*------------SEND DATA TO DATABASE---------*/
function addData(sender_id, msg)
{
    mongodb.MongoClient.connect(MONGODB_URI, (err, database) =>
    {
        let ar = [];
        let db = database.db("heroku_hdsdcjrx");
        db.collection("users").find( { _id: 1 } ).toArray().then((array) =>
        {
            ar = Object.values(array[0]._queue);

            if (msg.toLowerCase() == "manual")
            {
                callSendAPI(sender_id, MANUAL);
                
                database.close();
            }
            else if (ar.includes(sender_id))
            {
                if (msg.toLowerCase() == "end chat")
                {
                    db.collection("users").countDocuments( { "_id": sender_id }).then( // This doesn't mean anything.
                    function()
                    {
                        const k = ar.indexOf(sender_id);

                        if (k == 1)
                        ar.pop();
                        else ar.shift();

                        callSendAPI(sender_id, "[UBC CHATBOT]\nYou choose not to meet a new person. If you change your mind, type 'Start' or use the Start button in the menu")
                        
                        return ar;
                    }).then(
                    function(ar)
                    {
                        db.collection("users").replaceOne(
                            { "_id": 1, "_queue": Object.values(array[0]._queue) },
                            { "_id": 1, "_queue": ar }
                        );
                        database.close();
                    });
                }
                else
                {
                    callSendAPI(sender_id, "[UBC CHATBOT]\nWe are finding a stranger for you, be patient. If you want to stop finding, type 'End chat' or use the End Chat button in the menu");
                    
                    database.close();
                }
            }
            else
            {
                db.collection("users").countDocuments( { "_id": sender_id }).then(
                async function (value)
                {
                    if (value == 0 && msg.toLowerCase() == "start")
                    {
                        callSendAPI(sender_id, '[UBC CHATBOT]\nBe patient, you will be connected with a stranger. If you do not want to connect to human, type "End chat" or use the End Chat button in the menu');
                        ar.push(sender_id);
                        console.log("Add successfully !");
                        MATCH(ar, db);
                    }
                    else if (value == 0)
                    {
                        callSendAPI(sender_id, "[UBC CHATBOT]\nIf you want to start a chat, type 'Start' or use the Start button in the menu");
                    }
                    else
                    {
                        let match_info = await db.collection("users").findOne( {"_id": sender_id} );
                        
                        if (msg.toLowerCase() == "end chat")
                        {
                            callSendAPI(sender_id, "[UBC CHATBOT]\nYou have ended a chat. If you want to start a new conversation, type 'Start' or use the Start button in the menu");
                            callSendAPI(match_info._match, "[UBC CHATBOT]\nYou have been dumped :< If you want to start a new conversation, type 'Start' or use the Start button in the menu");
                            
                            db.collection("users").deleteOne( { "_id": sender_id } ).catch(e => console.log(e));
                            db.collection("users").deleteOne( { "_id": match_info._match } ).catch(e => console.log(e));
                        }
                        else callSendAPI(match_info._match, msg);
                    }

                }).then(
                function()
                {
                    if (ar != Object.values(array[0]._queue))
                    {
                        db.collection("users").replaceOne(
                            { "_id": 1, "_queue": Object.values(array[0]._queue) },
                            { "_id": 1, "_queue": ar }
                        );
                    }
                    database.close();
                });
            }
        });
    });
}

/*--------SEND MESSAGE TO FACEBOOK----------*/
function callSendAPI(sender_psid, response)
{
    const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v2.6/';

    // console.log('Sending: ', response);
    const request_body =
    {
        "recipient":
        {
            "id": sender_psid
        },
        "message":
        {
            "text": response
        }
    }

    // Send the HTTP request to the Messenger Platform
    request(    
    {
        "url": `${FACEBOOK_GRAPH_API_BASE_URL}me/messages`,
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) =>
    {
        if (err) console.error("Unable to send message:", err);
    });
}
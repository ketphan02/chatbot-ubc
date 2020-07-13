import dotenv from 'dotenv';
dotenv.config(); // Environment: Heroku

import express from 'express';
import bodyParser from 'body-parser';
import request from 'request';
import mongodb from 'mongodb';
import { usr_q } from './app.mjs';
import { MATCH } from './match.mjs';

export { WEBHOOK, callSendAPI };

const app = express();
const port = process.env.PORT || 27017;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // get this from Heroku

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:" + port.toString() + "/chatible-ubc";

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
            if (body.entry && body.entry.length <= 0) return;

            /*----GET MESSAGE AND PRINT TO CONSOLE----*/
            body.entry.forEach((entry) =>
            {
                entry.messaging.forEach((event) =>
                {
                    if (event.message) //If user send message
                    {
                        const sender_id = event.sender.id;
                        const msg = event.message.text;
                        const data = sender_id;

                        addData(data, sender_id, msg);
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
function addData(data, sender_id, msg)
{
    if (usr_q.includes(data)) return;

    mongodb.MongoClient.connect(MONGODB_URI, (err, database) =>
    {

        const db = database.db("heroku_hdsdcjrx");

        db.collection("users").countDocuments( { "_id": data.toString() }).then(info => console.log(info));

        db.collection("users").countDocuments( { "_id": data.toString() }).then(
        function (value)
        {
            if (value == 0 && msg.toLowerCase() == "start")
            {
                db.collection("users").update({_id: 1}, { $addToSet: { _queue: data } } );
                usr_q.push(data);
                console.log("Add successfully !");
                MATCH();
            }
            else if (value == 0)
            {
                callSendAPI(sender_id, "If you want to start a chat, type 'Start'");
            }
            else
            {
                console.log("Already matched !");
                const info = db.collection("users").findOne( {"_id": sender_id} )
                .then(
                    function(info)
                    {
                        if (msg.toLowerCase() == "end chat")
                        {
                            console.log("END CHAT TIME");
                            callSendAPI(sender_id, "DISCONNECTED");
                            callSendAPI(info._match, "DISCONNECTED");
                            db.collection("users").deleteOne( { "_id": sender_id } );
                            db.collection("users").deleteOne( { "_id": info._match } );
                        }
                        else 
                        {
                            callSendAPI(info._match, msg);
                        }
                    }
                );
            }
        });
    });
}

/*--------SEND MESSAGE TO FACEBOOK----------*/
function callSendAPI(sender_psid, response)
{
    const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v2.6/';

    console.log('Sending: ', response);
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


/***************************************
 * 
 * 
 * GIFT FOR UBCO STUDENTS
 * 
 * 
****************************************/
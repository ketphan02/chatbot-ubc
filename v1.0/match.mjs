import { usr_q } from './app.mjs';
import mongodb from 'mongodb';
import { callSendAPI } from './webhook.mjs';

export { MATCH };

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:" + port.toString() + "/chatible-ubc";

function MATCH()
{

    if (usr_q.length > 1)
    {
        console.log(usr_q);
        const usr1 = usr_q[0];
        const usr2 = usr_q[1];
        usr_q.shift(); usr_q.shift();
        console.log(usr_q);

        mongodb.MongoClient.connect(MONGODB_URI, (err, database) =>
        {
            const db = database.db("heroku_hdsdcjrx");
            db.collection("users").update( { _id: 1 }, { $pop: { _queue: -1 } } );
            db.collection("users").update( { _id: 1 }, { $pop: { _queue: -1 } } );

            db.collection("users").insertOne(
            {
                _id: usr1,
                _match: usr2
            });
            db.collection("users").insertOne(
            {
                _id: usr2,
                _match: usr1
            });

            console.log("Match successfully !");
            callSendAPI(usr1, "YOU ARE CHATING WITH A STRANGER");
            callSendAPI(usr2, "YOU ARE CHATING WITH A STRANGER")

            database.close();
        });
    }
}
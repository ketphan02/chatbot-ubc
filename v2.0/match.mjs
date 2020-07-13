import { callSendAPI } from './webhook.mjs';

export { MATCH };

function MATCH(arr, db)
{
    console.log(arr.length);
    if (arr.length > 1)
    {
        const usr1 = arr[0];
        const usr2 = arr[1];

        arr.shift(); arr.shift();

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
        callSendAPI(usr1, "[UBC CHATBOT]\nYou are chatting with a stranger. Enjoy!");
        callSendAPI(usr2, "[UBC CHATBOT]\nYou are chatting with a stranger. Enjoy!")
    }
    else console.log("Not enough");
}
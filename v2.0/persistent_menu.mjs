import dotenv from 'dotenv';
dotenv.config();

import request from 'request';

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

export { menuButton, GetStartedButton };

function menuButton()
{
    var messageData =
    {
        setting_type : "call_to_actions",
        composerinputdisabled :"TRUE",
        thread_state : "existing_thread",
        call_to_actions:
        [
        {
            type:"postback",
            title:"Start"
        },
        {
            type:"postback",
            title:"Manual"
        },
        {
            type:"postback",
            title:"End Chat"
        }
        ]
    };

    request(
    {
        "uri": 'https://graph.facebook.com/v2.6/me/thread_settings',
        "qs": { access_token: process.env.PAGE_ACCESS_TOKEN },
        "method": 'POST',
        "json": messageData
    },
    function (error, response, body)
    {
        if (!error && response.statusCode == 200)
        {
            console.log(body);
        }
        else
        {
            console.error(error);
        }
    });
}

function GetStartedButton(res)
{
    var messageData = {
        "get_started":
        [
            {
            "payload":"GET_STARTED"
            }
        ]};

        // Start the request
        request(
        {
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            form: messageData
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) console.log;
            else console.log(error);
        });
}
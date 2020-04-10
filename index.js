'use strict';

const express = require('express'),
	bodyParser = require('body-parser'),
    request = require('request'),
	app = express();

app.use(bodyParser.json());

app.route('/webhook')
    .post((req, res) => {
        const {body} = req;
        if (body.object === 'page') {
            body.entry.forEach((entry) => {
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;
                if (webhook_event.message) {
                    handleMessage(sender_psid, webhook_event.message);
                } else if (webhook_event.postback) {
                    handlePostback(sender_psid, webhook_event.postback);
                }
            });
            return res.status(200).send('EVENT_RECEIVED');
        }
        return res.sendStatus(404);
    })
    .get((req, res) => {
        const VERIFY_TOKEN = process.env.VERIFY_TOKEN || '';
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

		if(mode && token){
			if(mode === 'subscribe' && token === VERIFY_TOKEN){
				return res.status(200).send(challenge);
			}
			return res.sendStatus(403);
		}
	});

function handleMessage(sender_psid, received_message) {
    let response = {};
    if (received_message.text) {
        response = {
            "text": `Ito ny message nalefanao: "${received_message.text}". Andefaso sary hoe za zao!`
        }
    }
    else if (received_message.attachments) {
        const attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Ito ve ilay sary?",
                        "subtitle": "Tsindrio ny bokitra raha hamaly",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Eny!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "Tsia!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }
    callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback) {
    let response = {};
    let payload = received_postback.payload;
    if (payload === 'yes') {
        response = { "text": "Misaotra!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, andefaso hafa ary e." }
    }
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    const request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": process.env.PAGE_ACCESS_TOKEN || ''},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

app.listen(process.env.PORT || 1337, () => console.log('webhook is listnening'));

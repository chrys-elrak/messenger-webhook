'use strict';

const express = require('express'),
	bodyParser = require('body-parser'),
    request = require('request'),
	app = express();

app.use(bodyParser.json());

app.route('/webhook')
	.post((req, res)=>{
	let body = req.body;
	if(body.object === 'page'){
		body.entry.forEach((entry)=>{
			let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id;
            console.log(webhook_event);
            console.log('Sender PSID: ' + sender_psid);
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
		});
	return res.status(200).send('EVENT_RECEIVED');
	}
	return res.sendStatus(404);
	}).get((req, res) => {
		let VERIFY_TOKEN = process.env.VERIFY_TOKEN || '';
		let mode = req.query['hub.mode'];
		let token = req.query['hub.verify_token'];
		let challenge = req.query['hub.challenge'];

		if(mode && token){
			if(mode === 'subscribe' && token === VERIFY_TOKEN){
				console.log('WEBHOOK_VERIFIED');
				return res.status(200).send(challenge);
			}
			return res.sendStatus(403);
		}
	});

function handleMessage(sender_psid, received_message) {

    let response;
    if (received_message.text) {
        response = {
            "text": `You sent the message: "${received_message.text}". Now send me an image!`
        }
    }
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };

    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": process.env.PAGE_ACCESS_TOKEN},
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
app.listen(process.env.PORT || 1337, ()=>console.log('webhook is listnening'));

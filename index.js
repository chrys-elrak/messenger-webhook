'use strict';

const express = require('express'),
	bodyParser = require('body-parser'),
	app = express();

app.use(bodyParser.json());

app.route('/webhook')
	.post((req, res)=>{
	let body = req.body;
	if(body.object === 'page'){
		body.entry.forEach((entry)=>{
			let webhook_event = entry.messaging[0];
			console.log(webhook_event);
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

app.listen(process.env.PORT || 1337, ()=>console.log('webhook is listnening'));

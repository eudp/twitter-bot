const Twitter = require('twitter');
const request = require('request');
const cl = require('./index.js');
const config = require('./config.js');
const T = new Twitter(config);

const nFriends = '5';
var count = 0;

const paramsFriends = {
	count: nFriends
};

var errHandlerCount = function (err) {
    console.log(err);
    count++;
}

var errHandlerClose = function (err) {
    console.log(err);
    cl.closeReadline();
}

function countLimit() {
	if (count >= Number(nFriends)-1) {
		count = 0;
		cl.recursiveAsyncReadLine();
	} else {
		count++;
	}
}

async function sendMessage (paramsDm) {

	let text;
	try {
		let data = await T.post('direct_messages/new', paramsDm);

		text = `The message was sent with success to : @${paramsDm.screen_name}`;

	} catch(err) {
		text = new Error(`@${paramsDm.screen_name} | ${err[0].code} - ${err[0].message}`);
	}
	console.log(text);
	countLimit();
	
}

async function sendCustomMessage (text) {

	try {
		let data = await T.get('friends/list', paramsFriends);

		for (let i = 0; i < data.users.length; i++){

			let paramsDm = {
				screen_name: data.users[i].screen_name,
				text: text
			}
			sendMessage(paramsDm);
		}

	} catch(err) {
		errHandlerClose(err);
	}
	
}

function requestWoeid (location, screenName){
	return new Promise (function(resolve, reject) {

		request('http://woeid.rosselliot.co.nz/lookup/' + encodeURI(location.replace(',', '')),

		    function (error, response, body) {

		    	if (error) {
		    		reject(error);
		    	} else {
		    		let pos = body.search('data-woeid');

		        	if (pos !== -1) {

		        		let str = body.slice(pos+12, body.length);
		      
		        		let posEnd = str.indexOf('"');

		        		let paramsTrends = {
							id: str.slice(0,posEnd)
						}
						resolve(paramsTrends);
		        	} else {
		        		reject(new Error(`Couldn't find woeid for location of @${screenName}`));
		        	}
		    	}
		    }
		);
	});
}

async function sendTrends () {

	try {

		let dataFriends = await T.get('friends/list', paramsFriends);

		for (let i = 0; i < dataFriends.users.length; i++){

			try {

				let paramsTrends = await requestWoeid(dataFriends.users[i].location, dataFriends.users[i].screen_name);
				let dataTrends = await T.get('trends/place', paramsTrends);

				let trendsStr = 'Trends based in your location: \n';

				let j = 0;
				while (j < 5 && dataTrends[0].trends[j] !== undefined) {
					trendsStr += `${dataTrends[0].trends[j].name}\n`;
					j++;
				}

				let paramsDm = {
					screen_name: dataFriends.users[i].screen_name,
					text: trendsStr
				}

				sendMessage(paramsDm);

			} catch(err) {
				errHandlerCount(err);
			}
		}

	} catch (err) {
		errHandlerClose(err);
	}
}

async function sendTweet (q) {

	let paramsTweet = {
		q: q,
		count: '1',
		result_type: 'popular'
	}

	try {

		let dataTweet = await T.get('search/tweets', paramsTweet);

		if (dataTweet.statuses.length === 0){
			await Promise.reject(new Error(`There are not popular tweets for the keyword`));
		}

		let dataUsers = await T.get('friends/list', paramsFriends);

		for (let i = 0; i < dataUsers.users.length; i++){
			let paramsDm = {
				screen_name: dataUsers.users[i].screen_name,
				text: `https://twitter.com/${dataTweet.statuses[0].user.screen_name}/status/${dataTweet.statuses[0].id_str}`
			}

			sendMessage(paramsDm);
		}


	} catch(err) {
		errHandlerClose(err);
	}
}

exports.sendCustomMessage = sendCustomMessage;
exports.sendTrends = sendTrends;
exports.sendTweet = sendTweet;
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

function sendMessage (paramsDm) {

	T.post('direct_messages/new', paramsDm)
	.then(function (data) {
		return `The message was sent with success to : @${paramsDm.screen_name}`;
	})
	.catch(function (err) {
		return `@${paramsDm.screen_name} | ${err[0].code} - ${err[0].message}`;
	})
	.then(function(data) {
		console.log(data);
		countLimit();
	});
}

function sendCustomMessage (text) {

	T.get('friends/list', paramsFriends)
	.then(function(data) {
		for (let i = 0; i < data.users.length; i++){

			let paramsDm = {
				screen_name: data.users[i].screen_name,
				text: text
			}
			sendMessage(paramsDm);
		}
	})
	.catch(errHandlerClose);
}

function sendTrends () {

	T.get('friends/list', paramsFriends)
	.then( function (dataFriends) {
		for (let i = 0; i < dataFriends.users.length; i++){

			new Promise (function(resolve, reject) {

				request('http://woeid.rosselliot.co.nz/lookup/' + encodeURI(dataFriends.users[i].location.replace(',', '')),

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
				        		reject(`Couldn't find woeid for location of @${dataFriends.users[i].screen_name}`)
				        	}
				    	}
				    }
				);
			})
			.then(function(paramsTrends){

				return T.get('trends/place', paramsTrends);
			})
			.then(function (dataTrends) {

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
			})
			.catch(errHandlerCount);
		}

	})
	.catch(errHandlerClose);
}

function sendTweet (q) {

	let paramsTweet = {
		q: q,
		count: '1',
		result_type: 'popular'
	}
	let dataTweet;
	
	T.get('search/tweets', paramsTweet)
	.then(function (data) { 

		if (data.statuses.length === 0){
			return Promise.reject(`There are not trends for the keyword`);
		}
		dataTweet = data; 
		return T.get('friends/list', paramsFriends);
	})
	.then(function (dataUsers) {
		for (let i = 0; i < dataUsers.users.length; i++){
			let paramsDm = {
				screen_name: dataUsers.users[i].screen_name,
				text: `https://twitter.com/${dataTweet.statuses[0].user.screen_name}/status/${dataTweet.statuses[0].id_str}`
			}

			sendMessage(paramsDm);
		}
	})
	.catch(errHandlerClose);
}

exports.sendCustomMessage = sendCustomMessage;
exports.sendTrends = sendTrends;
exports.sendTweet = sendTweet;
const Twitter = require('twitter');
const request = require('request');
const cl = require('./index');
const config = require('./config.js');
const T = new Twitter(config);

const nFriends = '5';
var count = 0;

var paramsFriends = {
	count: nFriends
};

function sendMessage (paramsDm) {

	T.post('direct_messages/new', paramsDm, function(err, data, response){
		if (!err){
			console.log(`The message was sent with success to : @${paramsDm.screen_name}`);

		} else {
			console.log(`@${paramsDm.screen_name} | ${err[0].code} - ${err[0].message}`);
		}

		if (count >= Number(nFriends)-1) {
			count = 0;
			cl.recursiveAsyncReadLine();
		} else {
			count++;
		}

	});

}

function sendCustomMessage (text) {

	T.get('friends/list', paramsFriends, function(err, data, response) {
		if (!err){

			for (let i = 0; i < data.users.length; i++){

				let paramsDm = {
					screen_name: data.users[i].screen_name,
					text: text
				}

				sendMessage(paramsDm);
			}

		} else {
			console.log(err);
			cl.closeReadline();
		}
	});
}

function sendTrends () {

	T.get('friends/list', paramsFriends, function(err, dataFriends, response) {

		if (!err){

			for (let i = 0; i < dataFriends.users.length; i++){

				request('http://woeid.rosselliot.co.nz/lookup/' + encodeURI(dataFriends.users[i].location.replace(',', '')),

				    function (error, response, body) {

				        if (!error && response.statusCode == 200) {

				        	let pos = body.search('data-woeid');

				        	if (pos != -1) {

				        		let str = body.slice(pos+12, body.length);
				      
				        		pos = str.indexOf('"');

				        		let paramsTrends = {
									id: str.slice(0,pos)
								}

								T.get('trends/place', paramsTrends, function(err, dataTrends, response){
									if (!err){
										
										var trendsStr = 'Trends based in your location: \n';

										let j = 0;
										while (j < 5 && dataTrends[0].trends[j] != undefined) {
											trendsStr += `${dataTrends[0].trends[j].name}\n`;
											j++;
										}

										let paramsDm = {
											screen_name: dataFriends.users[i].screen_name,
											text: trendsStr
										}

										sendMessage(paramsDm);

									} else {
										console.log(err);
										count++;
									}
								});
								
				        	} else {
				        		console.log(`Couldn't find woeid for location of @${dataFriends.users[i].screen_name}`);
				        		count++;
				        	}
				        } else {
				        	console.log(error);
				        	count++;
				        }
				    }
				);
			}
		} else {
			console.log(err);
			cl.closeReadline();
		}
	});
}

function sendTweet (q) {

	let paramsTweet = {
		q: q,
		count: '1',
		result_type: 'popular'
	}

	T.get('search/tweets', paramsTweet, function(err, dataTweet, response) {
		if (!err){
			T.get('friends/list', paramsFriends, function(err, dataUsers, response) {
				if (!err){

					for (let i = 0; i < dataUsers.users.length; i++){

						let paramsDm = {
							screen_name: dataUsers.users[i].screen_name,
							text: `https://twitter.com/${dataTweet.statuses[0].user.screen_name}/status/${dataTweet.statuses[0].id_str}`
						}

						sendMessage(paramsDm);
					}

				} else {
					console.log(err);
					cl.closeReadline();
				}
			})
		} else {
			console.log(err);
			cl.closeReadline();
		}
	});
}

exports.sendCustomMessage = sendCustomMessage;
exports.sendTrends = sendTrends;
exports.sendTweet = sendTweet;
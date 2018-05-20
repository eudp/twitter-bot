const Twitter = require('twitter')
const request = require('request')
const cl = require('./index')
const config = require('./config.js')
const T = new Twitter(config)

const n_friends = '5'
var count = 0

var params_friends = {
	count: n_friends
}

function send_message (params_dm) {

	T.post('direct_messages/new', params_dm, function(err, data, response){
		if (!err){
			console.log(`The message was sent with success to : @${params_dm.screen_name}`)

		} else {
			console.log(`@${params_dm.screen_name} | ${err[0].code} - ${err[0].message}`)
		}

		if (count >= Number(n_friends)-1) {
			count = 0
			cl.recursiveAsyncReadLine()
		} else {
			count++
		}

	})

}

function send_custom_message (text) {

	T.get('friends/list', params_friends, function(err, data, response) {
		if (!err){

			for (let i = 0; i < data.users.length; i++){

				let params_dm = {
					screen_name: data.users[i].screen_name,
					text: text
				}

				send_message(params_dm)
			}

		} else {
			console.log(err)
			cl.closeReadline()
		}
	})
}

function send_trends () {

	T.get('friends/list', params_friends, function(err, data_friends, response) {

		if (!err){

			for (let i = 0; i < data_friends.users.length; i++){

				request('http://woeid.rosselliot.co.nz/lookup/' + encodeURI(data_friends.users[i].location.replace(',', '')),

				    function (error, response, body) {

				        if (!error && response.statusCode == 200) {

				        	let pos = body.search('data-woeid')

				        	if (pos != -1) {

				        		let str = body.slice(pos+12, body.length)
				      
				        		pos = str.indexOf('"')

				        		let params_trends = {
									id: str.slice(0,pos)
								}

								T.get('trends/place', params_trends, function(err, trends, response){
									if (!err){
										
										var trends_str = 'Trends based in your location: \n'

										let j = 0
										while (j < 5 && trends[0].trends[j] != undefined) {
											trends_str += `${trends[0].trends[j].name}\n`
											j++
										}

										let params_dm = {
											screen_name: data_friends.users[i].screen_name,
											text: trends_str
										}

										send_message(params_dm)

									} else {
										console.log(err)
										count++
									}
								})
								
				        	} else {
				        		console.log(`Couldn't find woeid for location of @${data_friends.users[i].screen_name}`)
				        		count++
				        	}
				        } else {
				        	console.log(error)
				        	count++
				        }
				    }
				)
			}
		} else {
			console.log(err)
			cl.closeReadline()
		}
	})
}

function send_tweet (q) {

	let params_tweet = {
		q: q,
		count: '1',
		result_type: 'popular'
	}

	T.get('search/tweets', params_tweet, function(err, data_tweet, response) {
		if (!err){
			T.get('friends/list', params_friends, function(err, data_users, response) {
				if (!err){

					for (let i = 0; i < data_users.users.length; i++){

						let params_dm = {
							screen_name: data_users.users[i].screen_name,
							text: `https://twitter.com/${data_tweet.statuses[0].user.screen_name}/status/${data_tweet.statuses[0].id_str}`
						}

						send_message(params_dm)
					}

				} else {
					console.log(err)
					cl.closeReadline()
				}
			})
		} else {
			console.log(err)
			cl.closeReadline()
		}
	})
}

exports.send_custom_message = send_custom_message
exports.send_trends = send_trends
exports.send_tweet = send_tweet
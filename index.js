const readline = require('readline')
const app = require('./app')

var handler = {}

handler['1'] = app.send_custom_message
handler['2'] = app.send_trends
handler['3'] = app.send_tweet

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function close () {
	rl.close()
}

var recursiveAsyncReadLine = function () {
	rl.question('\n\nPlease choose the number of the action you want to do with your friends or write exit for out: \n' + 
				'1) To send a message \n' + 
				'2) To send trends according location of themselves \n' + 
				'3) To send a popular tweet by keyword \n'
				, (number) => {

		console.log(`You chose the option ${number}`)

		switch(number){
			case '1':
				rl.question('Write your custom message: ', (answer) => {
					handler[number](answer)
				})
				break
			case '2':
				handler[number]()
				break
			case '3':
				rl.question('Write the keyword: ', (answer) => {
					handler[number](answer)
				})
				break
			case 'exit':
				rl.close()
				break
			default:
				console.log(`Please enter a valid option`)
				recursiveAsyncReadLine()
		}
	})
}

recursiveAsyncReadLine()

exports.recursiveAsyncReadLine = recursiveAsyncReadLine
exports.close = close
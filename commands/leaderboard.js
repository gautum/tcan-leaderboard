let request = require('superagent');
let HashMap = require('hashmap');
let players = new HashMap();
let config = require('../config');

module.exports = {
	 add: function (bot, msg) {
		console.log('__LEADERBOARD --> ADD__');
		let start = Date.now();
		let stop, diff;
		let platform = msg.content.split(" ")[2] || "pc";
		let epicId = msg.content.split(" ")[1];
		let url = `https://api.fortnitetracker.com/v1/profile/${platform}/${epicId}`;
		request.get(url)
		.set('TRN-Api-Key', config.SECRET)
		.end((err, res) => {
			if (err) {
				msg.channel.send(`Uh oh.  Something went wrong: `+ err);
				return;
			}
			console.log(res.body);
			if (res.body.error) {
				stop = Date.now();
				diff = (stop - start);
				msg.channel.send(`Could not find player ${epicId} in ${diff}ms.`);
			} else {
				players.set(epicId, res.body.stats);
				stop = Date.now();
				diff = (stop - start);
				msg.channel.send(`Successfully added ${epicId} in ${diff}ms.`);
			}
		});
	 },
     main: function(bot, msg) {
		console.log('__INIT LEADERBOARD__');
		let start = Date.now();
		let stop, diff;
		let directive = msg.content.split(" ")[0];
		let leaderboardMsg = "Leaderboard:\n\n";
		if (directive == "add") {
			this.add(bot, msg);
		}
		else if (directive == "solo") {
			players.forEach(function(value, key) {
				leaderboardMsg += `${key}: ${value.p2.top1.value}\n`;
			});
			stop = Date.now();
			diff = (stop-start);
			msg.channel.send(leaderboardMsg + `\nFinished in ${diff}ms`);
		}
		else if (directive == "duo") {
			players.forEach(function(value, key) {
				leaderboardMsg += `${key}: ${value.p10.top1.value}\n`;
			});
			stop = Date.now();
			diff = (stop-start);
			msg.channel.send(leaderboardMsg + `\nFinished in ${diff}ms`);
		}
		else if (directive == "squad") {
			players.forEach(function(value, key) {
				leaderboardMsg += `${key}: ${value.p9.top1.value}\n`;
			});
			stop = Date.now();
			diff = (stop-start);
			msg.channel.send(leaderboardMsg + `\nFinished in ${diff}ms`);
		}
		else {
			msg.channel.send("Please specify a mode with: ```!leaderboard <mode> <stat>```");
		}
    },
    help: 'Ping the bot'
};
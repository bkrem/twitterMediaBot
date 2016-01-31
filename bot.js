// Our Twitter library
var Twit = require('twit');

// We need to include our configuration file
var T = new Twit(require('./config.js'));

/**
 * This function finds the latest tweet with the given keyword, and retweets it.
 */
function retweetLatest() {
	// Search for the latest tweets matching query `q:`
	var keyword = {q: "yeezy", count: 10, result_type: "recent"};

	T.get('search/tweets', keyword, function (error, data) {

		if (error) return console.error("Error at T.get('search/tweets'): " + error);

	  	// ...then we grab the ID of the tweet we want to retweet...
		var retweetId = data.statuses[0].id_str;
		// ...and then we tell Twitter we want to retweet it!
		T.post('statuses/retweet/' + retweetId, { }, function (error, response) {
			if (response) {
				console.log('Success! Check your bot, it should have retweeted something.')
			}
			// If there was an error with our Twitter call, we print it out here.
			if (error) {
				console.log('There was an error with Twitter:', error);
			}
		})
	});
}

// Try to retweet something as soon as we run the program...
//retweetLatest();

// ...and then every hour after that. Time here is in milliseconds, so
// 1000 ms = 1 second, 1 sec * 60 = 1 min, 1 min * 60 = 1 hour --> 1000 * 60 * 60
setInterval(retweetLatest, 1000 * 60 * 60);

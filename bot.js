var fs = require('fs');

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

/***********************/

function getRandomHeadline(callback) {
	var agency, headline;
	var randomSelection = Math.floor(Math.random() * 10);
	console.log(randomSelection);
	var opts = {
		screen_name: 'guardian',
		count: 10,
		exclude_replies: true
	};

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) return console.error(err);

		agency = data[randomSelection].user.name;
		headline = data[randomSelection].text;
		callback(headline + " | " + agency);
	});
}

// function to encode file data to base64 encoded string
function base64_encode(file) {
	// read binary data
	var bitmap = fs.readFileSync(file);
	// convert binary data to base64 encoded string
	return new Buffer(bitmap).toString('base64');
}

function mediaUpload(news) {
	var img = base64_encode("/Users/BK/Desktop/yeezy.jpg");
	console.log(img);

	T.post('media/upload', { media: img }, function (err, data, response) {
		if (err) return console.error(err);

		var mediaIdStr = data.media_id_string;
		console.log(mediaIdStr);
		// now we can reference the media and post a tweet (media will attach to the tweet)
		var params = { status: news, media_ids: [mediaIdStr] };

		T.post('statuses/update', params, function (err, data, response) {
			console.log(data)
		})
	})
}

function simpleTweet(message) {
	T.post('statuses/update', { status: message }, function(err, data, response) {
		if (err) return console.error(err);
		console.log("Tweeted " + "'" + message + "' " + "successfully: ");
		console.log(data);
	})
}

// Try to retweet something as soon as we run the program...
//retweetLatest();

// ...and then every hour after that. Time here is in milliseconds, so
// 1000 ms = 1 second, 1 sec * 60 = 1 min, 1 min * 60 = 1 hour --> 1000 * 60 * 60
//setInterval(retweetLatest, 1000 * 60 * 60);

getRandomHeadline(function (news) {
	mediaUpload(news);
});
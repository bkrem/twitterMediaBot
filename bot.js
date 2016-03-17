var fs = require('fs');
var Twit = require('twit');
var Flickr = require('flickrapi');

var util = require('./util/util');
var config = require('./config/botConfig.js');

// Instance of Twit API
var T = new Twit(require('./config/twitConfig.js'));
// Instance of Flickr API
var flickrOpts = require('./config/flickrConfig');


/**
 * Logs the passed error and reruns the script.
 * Most errors are API-related => provides convenient way to try again.
 * @param err - the passed error object
 */
function logAndRerun(err) {
	console.error(err);
	return main();
}


/**
 *
 * @param callback
 */
function getImg (callback) {
	Flickr.tokenOnly(flickrOpts, function (error, flickr) {
		if (error) logAndRerun(error);

		var keywords = config.IMG_KEYWORDS;

		flickr.photos.search({
			// select a search keyword at random
			text: keywords[Math.floor( Math.random() * (keywords.length - 1) )]
		}, function (err, result) {
			if (err) logAndRerun(err);

			// choose a random pic ID out of the returned array
			var photoIndex = result.photos.photo.length - 1;
			var randomPicId = result.photos.photo[Math.floor(Math.random() * photoIndex)].id;

			flickr.photos.getSizes({api_key: flickrOpts, photo_id: randomPicId}, function (err, result) {
				if (err) logAndRerun(err);

				var picSizes = result.sizes.size; // array
				var targetImg;
				for (var i = 0; i < picSizes.length; i++)
					if (picSizes[i].label === config.IMG_SIZE) {
						targetImg = picSizes[i];
						break;
					}

				try {
					util.downloadImage(targetImg.source, config.IMG, function () {
						console.log("Done");
						callback(true);
					})
				} catch (e) {
					logAndRerun(e)
				}
			})
		});
	});
}


/**
 * Checks whether the passed headline has been posted before by comparing to
 * the previous 100 tweets of the bot
 * @param tweetText - text to be used in the new tweet
 * @param callback - bool => `true` or `false`
 */
function isTweetNew(tweetText, callback) {
	var opts = { screen_name: config.ACCOUNT, count: 100, exclude_replies: true };

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) logAndRerun(err);

		// check if any previous tweet text matches the new one
		for (var i = 0; i < data.length; i++) {
			// check if first 20 chars match for reasonable assurance
			if (data[i].text.substring(0,20) === tweetText.substring(0,20)) {
				return callback(false);
			}
		}
		// if no matches were found => return true for isTweetNew
		return callback(true);
	})
}


/**
 * Picks a random source from `sources` array, then selects a random tweet from determined source's timeline
 * @param callback
 */
function getRandomTweet(callback) {
	var sources = config.SOURCES;
	var opts = {
		screen_name: sources[Math.floor(Math.random() * (sources.length-1))],
		count: 10,
		exclude_replies: true
	};
	console.log('Selecting random tweet from: ' + opts.screen_name);

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) logAndRerun(err);

		var randSelection = data[Math.floor(Math.random() * (data.length-1))];

		var source = "@" + randSelection.user.screen_name;
		var text = randSelection.text;
		var tweet = text + "|" + source;

		if (tweet.length > 140) {
			console.info("Constructed tweet is too long; trying again...");
			return main();
		}
		if (callback) callback(tweet);
	});
}


/**
 *
 * @param text
 */
function mediaTweet(text) {
	var img = util.base64_encode(config.IMG);

	T.post('media/upload', { media: img }, function (err, data, response) {
		if (err) logAndRerun(err);

		var mediaIdStr = data.media_id_string;
		// now we can reference the media and post a tweet (media will attach to the tweet)
		var params = { status: text, media_ids: [mediaIdStr] };

		T.post('statuses/update', params, function (err, data, response) {
			if (err) {
				// Probably failed due to 140 char limit => call main() to try again
				console.error("Error at 'statuses/update': " + err);
				return main();
			}
			console.info('******TWEETED*******');
		})
	})
}


/**
 * Publishes a simple text-only tweet
 * @param message - string to be tweeted
 */
function simpleTweet(message) {
	T.post('statuses/update', { status: message }, function(err, data, response) {
		if (err) console.error(err);
		console.log("Tweeted " + "'" + message + "' " + "successfully: ");
	})
}


function main() {
	getRandomTweet(function (text) {
		console.log(text);
		// Check if we've tweeted this text before
		isTweetNew(text, function (isNew) {
			if (isNew) {
				try {
					getImg(function () {
						// Attach the text to the Twitter API media upload
						mediaTweet(text);
					});
				} catch (e) {
					logAndRerun(e)
				}
			} else {
				console.log("Tweet is not new; trying again...");
				return main()
			}
		})
	});
}

// MAIN
main();
setInterval(main, 1000 * 60 * 60);
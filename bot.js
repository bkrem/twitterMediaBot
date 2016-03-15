var fs = require('fs');
var Twit = require('twit');
var Flickr = require('flickrapi');

var util = require('./util/util');

// Instance of Twit API
var T = new Twit(require('./config/twitConfig.js'));
// Instance of Flickr API
var flickrOpts = require('./config/flickrConfig');


/**
 * Logs the passed error and reruns the script.
 * Most errors are API-related => provides convenient way to try again.
 *
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
function getPic (callback) {
	Flickr.tokenOnly(flickrOpts, function (error, flickr) {
		if (error) logAndRerun(error);

		var textOpts = ["kanye+west", "kanye+west+kim+kardashian", "yeezus"];

		flickr.photos.search({
			text: textOpts[Math.floor( Math.random() * (textOpts.length - 1) )]
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
					if (picSizes[i].label === 'Medium') {
						targetImg = picSizes[i];
						break;
					}

				try {
					util.downloadImage(targetImg.source, "yeezy.jpg", function () {
						console.log("Done");
						callback(true);
					})
				} catch (e) {
					console.error(e);
					return main();
				}
			})
		});
	});
}


/**
 * Checks whether the passed headline has been posted before by comparing to
 * the previous 100 tweets on @YeezyNewsBot
 *
 * @param tweetText
 * @param callback
 */
function isTweetNew(tweetText, callback) {
	var opts = { screen_name: 'YeezyNewsBot', count: 300, exclude_replies: true };

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) logAndRerun(err);

		// check if any previous tweet text matches the new one
		for (var i = 0; i < data.length; i++) {
			if (data[i].text.substring(0,20) === tweetText.substring(0,20)) {
				return callback(false);
			}
		}
		// if no matches were found => return true for isTweetNew
		return callback(true);
	})
}


/**
 *
 * @param callback
 */
function getRandomHeadline(callback) {
	var sources = ['guardian', 'NYDailyNews', 'BBCWorld', 'nytimes', 'BBCBusiness',
					'BreakingNews', 'AP', 'ABC', 'nytopinion', 'washingtonpost',
					'Independent', 'BBCBreaking', 'CBSNews', 'cnnbrk', 'WSJ'];
	var opts = {
		screen_name: sources[Math.floor(Math.random() * (sources.length-1))],
		count: 10,
		exclude_replies: true
	};
	console.log(opts.screen_name);

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) logAndRerun(err);

		var randSelection = data[Math.floor(Math.random() * (data.length-1))];

		var agency = "@" + randSelection.user.screen_name;
		var headline = randSelection.text;
		var tweet = headline + "|" + agency;

		if (tweet.length > 140) {
			console.info("Constructed tweet is too long; trying again...");
			return main();
		}
		if (callback) callback(tweet);
	});
}


/**
 *
 * @param news
 */
function mediaUpload(news) {
	var img = util.base64_encode("yeezy.jpg");

	T.post('media/upload', { media: img }, function (err, data, response) {
		if (err) logAndRerun(err);

		var mediaIdStr = data.media_id_string;
		// now we can reference the media and post a tweet (media will attach to the tweet)
		var params = { status: news, media_ids: [mediaIdStr] };

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
 *
 * @param message
 */
function simpleTweet(message) {
	T.post('statuses/update', { status: message }, function(err, data, response) {
		if (err) console.error(err);
		console.log("Tweeted " + "'" + message + "' " + "successfully: ");
	})
}


function main() {
	getRandomHeadline(function (news) {
		console.log(news);
		// Check if we've tweeted this headline before
		isTweetNew(news, function (isNew) {
			if (isNew) {
				try {
					getPic(function () {
						// Attach the formatted headline to the Twitter API media upload
						mediaUpload(news);
					});
				} catch (e) {
					console.error(e);
					return main();
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
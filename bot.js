var fs = require('fs');
var request = require('request');
var Twit = require('twit');
var Flickr = require('flickrapi');

var util = require('./util/util');

// Instance of Twit API
var T = new Twit(require('./config/twitConfig.js'));
// Instance of Flickr API
var flickrOpts = require('./config/flickrConfig');

function getKanyePic() {
	Flickr.tokenOnly(flickrOpts, function (error, flickr) {
		if (error) throw new Error(error);

		flickr.photos.search({
			text: "kanye+west"
		}, function (err, result) {
			if (err) console.error(err);

			// choose a random pic ID out of the returned array
			var randInt = Math.floor(Math.random() * 99);
			var randomPicId = result.photos.photo[randInt].id;

			flickr.photos.getSizes({api_key: flickrOpts, photo_id: randomPicId}, function (err, result) {
				if (err) return console.error(err);

				var picSizes = result.sizes.size; // array
				var targetImg;
				for (var i = 0; i < picSizes.length; i++)
					if (picSizes[i].label === 'Medium') {
						targetImg = picSizes[i];
						break;
					}

				util.downloadImage(targetImg.source, "yeezy.jpg", function () {
					console.log("Done");
				})
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
	var opts = { screen_name: 'YeezyNewsBot', exclude_replies: true };

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) return console.error(err);

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

function getRandomHeadline(callback) {
	var agency, headline;
	var randomSelection = Math.floor(Math.random() * 10);
	var opts = {
		screen_name: 'guardian',
		count: 10,
		exclude_replies: true
	};

	T.get('statuses/user_timeline', opts, function (err, data) {
		if (err) return console.error(err);

		agency = data[randomSelection].user.name;
		headline = data[randomSelection].text;
		if (callback) callback(headline + " | " + agency);
	});
}

function mediaUpload(news) {
	var img = util.base64_encode("yeezy.jpg");

	T.post('media/upload', { media: img }, function (err, data, response) {
		if (err) return console.error(err);

		var mediaIdStr = data.media_id_string;
		console.log(mediaIdStr);
		// now we can reference the media and post a tweet (media will attach to the tweet)
		var params = { status: news, media_ids: [mediaIdStr] };

		T.post('statuses/update', params, function (err, data, response) {
			if (err) console.error(err);
		})
	})
}

function simpleTweet(message) {
	T.post('statuses/update', { status: message }, function(err, data, response) {
		if (err) return console.error(err);
		console.log("Tweeted " + "'" + message + "' " + "successfully: ");
	})
}

function kanyeTweet() {
	getRandomHeadline(function (news) {
		console.log(news);
		// Check if we've tweeted this headline before
		isTweetNew(news, function (isNew) {
			if (isNew) {
				// Attach the formatted headline to the Twitter API media upload
				mediaUpload(news);
				// Get a new Kanye pic for next tweet
				getKanyePic();
			} else {
				console.log("Tweet is not new; trying again...");
				return kanyeTweet()
			}
		})
	});
}

// MAIN
kanyeTweet();
setInterval(kanyeTweet, 1000 * 60 * 5);
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

			var randInt = Math.floor(Math.random() * 99);
			var randomPicId = result.photos.photo[randInt].id;

			flickr.photos.getSizes({api_key: flickrOpts, photo_id: randomPicId}, function (err, result) {
				if (err) return console.error(err);

				var picSizes = result.sizes.size; // array
				var mediumImage;
				for (var i = 0; i < picSizes.length; i++)
					if (picSizes[i].label === 'Medium') {
						mediumImage = picSizes[i];
						break;
					}

				util.downloadImage(mediumImage.source, "yeezy.jpg", function () {
					console.log("Done")
				})
			})
		});
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

function mediaUpload(news) {
	var img = util.base64_encode("yeezy.jpg");
	console.log(img);

	T.post('media/upload', { media: img }, function (err, data, response) {
		if (err) return console.error(err);

		var mediaIdStr = data.media_id_string;
		console.log(mediaIdStr);
		// now we can reference the media and post a tweet (media will attach to the tweet)
		var params = { status: news, media_ids: [mediaIdStr] };

		T.post('statuses/update', params, function (err, data, response) {
			if (err) console.error(err);
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

/*getRandomHeadline(function (news) {
	mediaUpload(news);
});*/

getKanyePic();

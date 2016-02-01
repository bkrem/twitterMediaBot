var fs = require('fs');
var request = require('request');
var Twit = require('twit');
var Flickr = require('flickrapi');

// Instance of Twit API
var T = new Twit(require('./config/twitConfig.js'));
// Instance of Flickr API
var flickrOpts = require('./config/flickrConfig');

function getKanye() {
	Flickr.authenticate(flickrOpts, function (error, flickr) {
		if (error) throw new Error(error);

		flickr.photos.search({
			text: "kanye+west"
		}, function (err, result) {
			if (err) console.error(err);

			var randomPicId = result.photos.photo[0].id;
			flickr.photos.getSizes({api_key: flickrOpts, photo_id: randomPicId}, function (err, result) {
				if (err) console.error(err);

				var randInt = Math.floor(Math.random() * 10);
				console.log(result.sizes.size[randInt]);
				downloadRandomKanye(result.sizes.size[randInt].source, "randomKanye" + randInt + ".jpg", function () {
					console.log("Done")
				})
			})
		});
	});
}

function downloadRandomKanye(uri, filename, callback){
	request.head(uri, function(err, res, body){
		console.log('content-type:', res.headers['content-type']);
		console.log('content-length:', res.headers['content-length']);

		request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
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

/*getRandomHeadline(function (news) {
	mediaUpload(news);
});*/
getKanye();
setInterval(getKanye(), 1000 * 10);
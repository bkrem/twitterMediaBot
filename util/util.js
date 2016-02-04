/**
 * Created by BK on 04/02/16.
 */
var fs = require('fs');
var request = require('request');

module.exports = {

    // function to encode file data to base64 encoded string
    base64_encode: function (file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    },

    downloadImage: function (uri, filename, callback){
        request.head(uri, function(err, res, body){
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    }

};

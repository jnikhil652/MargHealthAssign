var http = require('http');
const mongodb = require("mongodb").MongoClient;
let url = "mongodb://localhost:27017/";
var formidable = require('formidable');
var fs = require('fs');
const fastcsv = require("fast-csv");

http.createServer(function(req, res) {
    if (req.url == '/uploadCSV') {
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var oldpath = files.filetoupload.filepath;
            var newpath = 'C:/xampp/htdocs/MargHealthAssign/uploads/' + files.filetoupload.originalFilename;
            fs.rename(oldpath, newpath, function(err) {
                if (err) throw err;
                let stream = fs.createReadStream(newpath);
                let csvData = [];
                let csvStream = fastcsv
                    .parseStream(stream, { headers: true })
                    .on("data", function(data) {
                        csvData.push(data);
                    })
                    .on("end", function() {
                        // remove the first line: header
                        csvData.shift();
                        console.log(csvData);
                        // save to the MongoDB database collection
                        mongodb.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
                            if (err) throw err;

                            client.db("csv_data").collection("csv").insertMany(csvData, (err, res) => {
                                if (err) throw err;
                                console.log(`Inserted: ${res.insertedCount} rows`);
                                client.close();
                            });
                        });

                    });
            });
        });
    }
    if (req.url == '/GetAll') {
        mongodb.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
            if (err) throw err;

            client.db("csv_data").collection("csv").find({}).toArray(function(err, result) {
                if (err) throw err;
                // console.log(result);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
                client.close();
            });
        });
    }
}).listen(8080);
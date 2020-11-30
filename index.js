const WebSocketServer = require("ws").Server;
var express = require("express")
const Recorder = require('node-rtsp-recorder').Recorder
const fs = require("fs");
const { fx } = require("jquery");
var mysql = require('mysql');
const config = require('./db_config.json');

var rec = new Recorder({
	url: 'rtsp://192.168.0.65:8554/test',
	timeLimit: 60,
	folder: '/home/pshy/js-server/public',
	name: 'videos'
});

var cap = new Recorder({
    url: 'rtsp://192.168.0.65:8554/test',
    folder: '/home/pshy/js-server/public',
    name: 'images',
    type: 'image'
});

let pool = mysql.createPool(config);

function getConnection(callback) {
    pool.getConnection(function (err, conn) {
        if(!err) {
            callback(conn);
        }
    });
}

const wss_detected = new WebSocketServer({ port : 3000 });
const wss_multicast = new WebSocketServer({ port : 3001 });

const clients = new Set();
var recording_flag = false;
var detect_flag = false;
var fileName = '';
var stillName = '';

var app = express();

app.use('/', express.static(__dirname + '/public'));

app.listen(8080, function() {
    console.log('Server On! Port: 8080 / url: http://localhost:8080');
})

wss_detected.on("connection", function(ws) {
    ws.on('message', function(message) {
        const sendData = {
            event: 'response',
            data: null
        };
        var rcv_data = JSON.parse(message);
        console.log(rcv_data);

        sendData.data = 'hello';

        switch (rcv_data.event) {
            case 'connection' :
                console.log(rcv_data);
                clients.add(ws);
                break;
            case 'catch':
                // record start
                if(recording_flag == false) {
                    fileName = rec.startRecording();
                    console.log(fileName)
                    console.log(fileName.split('/')[6]);
                    recording_flag = true;

                    setTimeout(() => {
                        console.log('Stopping Recording')
                        rec.stopRecording()

                        console.log('Waiting Detect event...(10s)')
                        setTimeout(() => {
                            if(detect_flag == false) {
                                console.log('detect event not received..')
                                fs.unlink(fileName, (err) => {
                                    if(err) {
                                        console.error(err)
                                        return
                                    }
                                })
                            } else {
                                getConnection((conn) => {
                                    var sql = "INSERT INTO detectList (videoFileName, stillImgFileName) VALUES ('" + fileName.split('/')[6] + "', '" + stillName.split('/')[6] + "')";
                                    conn.query(sql, function(err, result) {
                                        if(err) throw err;
                                        console.log(result);
                                    });
                                    conn.release();
                                })
                        
                                console.log("detect event sended!!")
                                sendData.event = 'detect';
                                sendData.data = [fileName.split('/')[6], stillName.split('/')[6]];
                                console.log(sendData.data);
                                for(let client of clients) {
                                    client.send(JSON.stringify(sendData));
                                }
                            }
                            recording_flag = false;
                            detect_flag = false;
                        }, 10000)
                    }, 10000)
                }
                break;
            case 'detect':
                //record stop, store mp4 file
                //send Data: mp4 filename
                //send Event: detect
                if(recording_flag == true) {
                    console.log('appropriate detect event received!')

                    if(detect_flag == false) {
                        cap.captureImage((filename) => {
                            console.log(filename);
                            stillName = filename;
                        })
                    }
                    detect_flag = true;
                }
                break;
            default:
        }

	rcv_data = null;
    });
});

wss_multicast.on("connection", function(ws) {
    ws.on('message', function(message) {
        const sendData = {
            event: 'response',
            data: null
        };

        //console.log(message);
        var rcv_data = JSON.parse(message);

        switch (rcv_data.event) {
            case 'connection' :
                console.log(rcv_data);
                clients.add(ws);

                sendData.event = 'fileList';
                sendData.data = fs.readdirSync(__dirname + "/public/videos/")
                ws.send(JSON.stringify(sendData));

                sendData.event = 'detectList';
                getConnection((conn) => {
                    var sql = "SELECT * FROM detectList";
                    conn.query(sql, function(err, result) {
                        if(err) throw err;
                        console.log(result);
                        sendData.data = JSON.parse(JSON.stringify(result));
                        ws.send(JSON.stringify(sendData));
                    });

                    conn.release();
                })
                
                break;
            default:
        }
    })
})

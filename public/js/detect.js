var ws = new WebSocket("ws://192.168.0.2:3001/");
ws.onopen = function(event) {
    const sendData = {
        event: 'response',
        data: null
    }
    sendData.event = 'connection';
    ws.send(JSON.stringify(sendData));
}
ws.onmessage = function(message) {
    var rcv_data = message.data;
    var json_data = JSON.parse(rcv_data);

    switch(json_data.event) {
        case 'detect':
            window.open("../popup.html?fileName=" + String(json_data.data[0]) + "&stillName=" + String(json_data.data[1]), "Popup", "width=600,height=900");

            window.location.reload();
            // send parameters(video filename)
            break;
        case 'fileList':
            // var files = json_data.data;
            // for(let file of files) {
            //     $('.video-list').append("<div class=\"video-item\"><video src=\"videos/" + String(file) + "\" controls width=250></video><p>" + String(file) + "<p></div>")
            // }
            break;
        case 'detectList':
            var items = json_data.data;
            for(let item of items) {
                console.log(item);
                //$('.detect-list').append("<li><a href=\"http://192.168.0.2:8080/popup.html?fileName=" + item.videoFileName.split('.')[0] + "&stillName=" + item.stillFileName.split('.')[0] + "\"></a></li>")
                //$('.detect-list').append("<li><a href=\"http://192.168.0.2:8080/popup.html?fileName=" + ((String)(item.videoFileName)) + "&stillName=" + ((String)(item.stillImgFileName)) + "\">" + ((String)(item.stillImgFileName)).split('.')[0] + "</a></li>")
                $('.detect-list').append("<li onclick=zzz(\"" + ((String)(item.videoFileName)) + "\",\"" + ((String)(item.stillImgFileName)) + "\")>" + ((String)(item.stillImgFileName)).split('.')[0] + "</li>")
            }
            break;
        default:
            console.log(json_data.data);
    }
}

function zzz(msg, msg1) {
    window.open("../popup.html?fileName=" + msg + "&stillName=" + msg1, "Popup", "width=600,height=900");
}
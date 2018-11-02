var jsonStream = require('duplex-json-stream')
var net = require('net')

function doCore(json) {
    if(json["cmd"])
        return doCommand(json["cmd"]);
}

function doCommand(jsonCommand) {
    switch(jsonCommand) {
        case 'balance':
            return {cmd: 'balance', balance: 0};
    }
}

var server = net.createServer(function (socket) {
    socket = jsonStream(socket)
    socket.on('data', function(data) {
        console.log("Bank received: ", data)
        socket.write(doCore(data))
    })
})
server.listen(3876)
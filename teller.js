var jsonStream = require('duplex-json-stream')
var net = require('net')

var client = jsonStream(net.connect(3876))

client.write({cmd: 'balance'})
client.on('data', function (data) {
    console.log("Teller received: ", data)
    client.destroy();
})

client.end
var jsonStream = require('duplex-json-stream')
var net = require('net')

var depositAmount = 0;
var arguments = [];

run();


function run()
{   
    //Store the argument
    arguments = process.argv.slice();

    if(arguments.length <= 2 || arguments.length > 4) {
        console.log("Invalid number of arguments: Found", arguments.length);
    }
    else {
        sendCommand(arguments[2], Number(arguments[3]));
    }
}

function sendCommand(accountCommand, value) {

    var client = jsonStream(net.connect(3876))

    if(accountCommand == 'balance') {
        client.write({cmd: accountCommand});
        client.on('data', function (data) {
            console.log("Teller received: ", data)
            client.destroy();
        })
    }
    else if(accountCommand == 'deposit') {
        client.write({cmd: accountCommand, amount:value})

        client.on('data', function (data) {
            console.log("Teller depositing: ", value);
            console.log("Balance: ", data)
            client.destroy();
        })
    }
    else if(accountCommand == 'withdraw') {
        client.write({cmd: accountCommand, amount:value})

        client.on('data', function (data) {
            console.log("Teller withdrawing: ", value);
            console.log("Balance: ", data)
            client.destroy();
        })
    }
    else {
        client.write({cmd: accountCommand})

        client.on('data', function (data) {
            console.log("Bank Response: ", data);
            client.destroy();
        })
    }    
    client.end
}
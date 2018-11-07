var jsonStream = require('duplex-json-stream')
var net = require('net')
var fs = require('fs')
var sodium = require('sodium-native')

var balance = 0;
var log = [];
const logFile = 'log.json';

updateLogFromFile();

function generateHash(data) {
    var output = Buffer.alloc(sodium.crypto_generichash_BYTES)
    var input = Buffer.from(data)
    sodium.crypto_generichash(output, input)
    return output.toString('hex');
}

function getBalance() {
    return balance;
}

function updateLogToFile() {
    fs.writeFile(logFile, JSON.stringify(log), function(err) {
        if(err)
            throw err;
    });
}

function updateLogFromFile() {
    console.log("**** Reading previous Transaction File ****");
    fs.stat(logFile, function(err) {
        if(err == null) {
            fs.readFile(logFile, "utf8", function(err, data) {
                var objects = JSON.parse(data);

                //Add the objects inside the interal log
                for(i=0; i<objects.length; i++) {
                    doCore(objects[i]);
                }
                printLog("LOADED");
            });
        }
    });

    return true;
}

function addHashLogEntry(entry) {
    var genesisHash = Buffer.alloc(32).toString('hex')
    var prevHash = log.length ? log[log.length-1].hash : genesisHash
    
    log.push({
        value: entry,
        hash: hashToHex(prevHash + JSON.stringify(entry))
    })
}

function addLogEntry (command, amount) {
    var value = {cmd: command, amount: amount};
    log.push(value);
    updateLogToFile();
    //addHashLogEntry(value);
}

function addBalance(amount) {
    if(amount > 0)
    {
        balance += amount;
        return true;
    }
    return false;
}

function setDeposit(amount) {
    if(addBalance(amount))
        addLogEntry('deposit', amount);
}

function removeBalance(amount) {
    if(amount > 0 && (balance-amount) >= 0)
    {
        balance -= amount;
        return true;
    }
    return false;
}

function setWithdraw(amount) {
    if(removeBalance(amount))
        addLogEntry('withdraw', amount);
}

function getBalanceWithCommand() {
    return {cmd: 'balance', balance: getBalance()};
}

function doCore(json) {
    if('cmd' in json)
        return doCommand(json);
}

//Logging
function printLog(externalMsg) {
    console.log("****", externalMsg == null ? "" : externalMsg, "TRANSACTION LOG ****")
    for(i=0; i<log.length; i++) {
        console.log(log[i]);
    }
    console.log("****", externalMsg == null ? "" : externalMsg, "TRANSACTION LOG ****")
}

function doCommand(obj) {
    switch(obj['cmd']) {
        case 'balance':
            return getBalanceWithCommand();
        case 'deposit':
            setDeposit(obj['amount']);
            return getBalanceWithCommand();
        case 'withdraw':
            setWithdraw(obj['amount']);
            return getBalanceWithCommand();
        default:
            return "Error - Command Not Found";
    }
}

var server = net.createServer(function (socket) {
    socket = jsonStream(socket)
    socket.on('data', function(data) {

        console.log("Bank received: ", data)

        socket.write(doCore(data));
        
        printLog();
    })
})
server.listen(3876)
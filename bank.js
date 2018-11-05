var jsonStream = require('duplex-json-stream')
var net = require('net')
var fs = require('fs')


var balance = 0;
var log = [];
const logFile = 'transactionlog.txt';
var isLogLoaded = false;

function add(total, amount) { return total+= amount; }
function subtract(total, amount) { return total-= amount; }

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

    isLogLoaded = true;
    return true;
}

function addLogEntry (command, amount) {
    log.push({cmd: command, amount: amount});
    updateLogToFile();
}

function setDeposit(amount) {
    if(amount > 0)
    {
        balance += amount;
        addLogEntry('deposit', amount);
    }
}

function setWithdraw(amount) {
    if(amount > 0 && (balance-amount) >= 0)
    {
        balance -= amount;
        addLogEntry('withdraw', amount);
    }
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

    if(!isLogLoaded)
        updateLogFromFile();

    socket.on('data', function(data) {

        console.log("Bank received: ", data)

        socket.write(doCore(data));
        
        printLog();
    })
})
server.listen(3876)
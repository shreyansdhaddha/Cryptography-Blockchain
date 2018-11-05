var jsonStream = require('duplex-json-stream')
var net = require('net')

var balance = 0;
var log = [];

function getBalance() {
    return balance;
}

function addLogEntry (command, amount) {
    log.push({cmd: command, amount: amount});
    return true;
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
    if('cmd'in json)
        return doCommand(json);
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

//Logging
function printLog() {
    console.log("**** TRANSACTION LOG ****")
    for(i=0; i<log.length; i++) {
        console.log(log[i]);
    }
    console.log("**** TRANSACTION LOG ****")
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
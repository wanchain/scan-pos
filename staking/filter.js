`use strict`


let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"


function main() {
    var filter = web3.eth.filter({address:'0x0000000000000000000000000000000000000262',
        fromBlock: 1,
        topics:[null]});

    var myResults = filter.get(function(error, logs){
        console.log(error);
        console.log(logs);
    })

}   //console.log(myResults)

main()
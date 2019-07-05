'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()

async function main() {
    let stakers = web3.pos.getStakerInfo(web3.eth.blockNumber)
    for(let i=0; i<stakers.length; i++) {
        console.log(stakers[i].address)
        let b = web3.eth.getBalance(stakers[i].address)
        console.log(web3.fromWei(b).toString(10))
    }
}


main();
'use strict'

let CoinNodeObj = require('./conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
const optimist = require('optimist');
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const assert = require('assert');
let _coinbase;
const totalCount = 210
let passwd = require("./generateAccountPasswd")
let argv = optimist
    .usage('Usage: $0 -r [repeatCount]')
    .default('r', 1)
    .argv;

let pubkeys = []
async function createOne(i) {
    let addr = await pu.promisefy(web3.personal.newAccount, [passwd[i]], web3.personal)
    let pubs = await pu.promisefy(web3.personal.showPublicKey, [addr, passwd[i]], web3.personal)
    let secpub = pubs[0]
    console.log("address:", addr, "plublic key:", secpub, "password:", passwd[i])
    pubkeys.push(secpub)
}
async function main() {
    let repeat = argv.r
    console.log("every account repeat: ", repeat)
    let keyCount = parseInt((totalCount+repeat-1)/repeat)
    console.log("total key count:", keyCount)
    for(let i=0; i<keyCount; i++) {
        await createOne(i)
    }
    console.log(pubkeys)
    console.log("==========copy following pubkeys to code ==============")
    for(let i=0; i<keyCount; i++){
        for(let k=0; k<repeat; k++) {
            let index = i*repeat + k
            if(index >= totalCount) {
                return
            }
            console.log("\""+pubkeys[i]+"\"")
        }
    }
}
main()
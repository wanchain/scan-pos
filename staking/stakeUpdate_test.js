'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"


describe('stakeUpdate test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "stakeAppend failed")
    })
    it("T0 Normal stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 12)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(0, payload)

        console.log("tx5=" + txhash)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "stakeUpdate failed")
    })
    it("T1 invalidAddr stakeUpdate", async ()=>{
        let payload = skb.coinContract.stakeUpdate.getData("0x9988", 12)
        payload = payload.slice(0,16)
        console.log("payload:", payload)
        try {
            let txhash = await skb.sendStakeTransaction(0, payload)
            log.info("delegateOut tx:", txhash)
            assert(false, "invalidAddr stakeUpdate failed")
        }catch(err){
            console.log(err.toString())
            assert(err.toString().indexOf('Error: stakeUpdate verify failed') ==0 , "invalidAddr stakeUpdate failed")
        }

    })
    it("T2 none-exist address stakeUpdate", async ()=>{
        let payload = skb.coinContract.stakeUpdate.getData("0x90000000000000000000000000000000000000d2", 12)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(0, payload)


        log.info("stakeUpdate tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "none-exist address stakeUpdate failed")
    })



    it("T21 lockTime==6 stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 6)
        try {
            let txhash = await skb.sendStakeTransaction(0, payload)
            log.info("stakeUpdate tx:", txhash)
            assert(false, "lockTime==6 stakeUpdate should fail")
        }catch(err){
            console.log(err.toString())
            assert(err.toString().indexOf('Error: stakeUpdate verify failed') == 0, "lockTime==6 stakeUpdate should fail")
        }

    })
    it("T22 lockTime==91 stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 91)
        try {
            let txhash = await skb.sendStakeTransaction(0, payload)
            log.info("stakeUpdate tx:", txhash)
            assert(false, "lockTime==91  stakeUpdate should fail")
        }catch(err){
            console.log(err.toString())
            assert(err.toString().indexOf('Error: stakeUpdate verify failed') == 0, "lockTime==91  stakeUpdate should fail")
        }
    })
    it("T23 lockTime==7 stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 7)
        let txhash = await skb.sendStakeTransaction(0, payload)

        log.info("stakeUpdate tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "lockTime==7 stakeUpdate failed")
    })
    it("T24 lockTime==90 stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 90)
        let txhash = await skb.sendStakeTransaction(0, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "lockTime==90 stakeUpdate failed")
    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

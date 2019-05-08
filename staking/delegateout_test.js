'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const skb = require('./stakebase.js')
const assert = require('assert');


describe('delegateOut test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, skb.passwd], web3.personal)
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
        assert(status == '0x1', "stakeIn failed")
    })
    it("T0  invalidaddr delegateOut", async ()=>{

        // payload
        let payload = skb.coinContract.delegateOut.getData("0x9988")
        payload = payload.slice(0,16)
        console.log("payload:", payload)
        try {
            let txhash = await skb.sendStakeTransaction(0, payload)
            log.info("delegateOut tx:", txhash)
            assert(false, "invalidAddr delegateOut should fail")
        }catch(err){
            console.log(err.toString())
            assert(err.toString() == 'Error: delegateOut verify failed', "invalidAddr delegateOut should fail")
        }
    })
    it("T1  non-exist delegateOut", async ()=>{

        // delegateOut
        let payload = skb.coinContract.delegateOut.getData("0x80000000000000000000000000000000000000d2")
        let txhash = await skb.sendStakeTransaction(0, payload)


        log.info("delegateOut tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "non-exist  delegateOut should fail")
    })

    it("T2 msgfrom non-exist delegateOut", async ()=>{

        // delegateOut
        let payload = skb.coinContract.delegateOut.getData(newAddr)
        let txhash = await skb.sendStakeTransaction(0, payload)


        log.info("delegateOut tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "msgfrom non-exist delegateOut should fail")
    })

    it("T3 normal delegateOut", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 140
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "delegateIn failed")


        // delegateOut
        payload = skb.coinContract.delegateOut.getData(newAddr)
        txhash = await skb.sendStakeTransaction(0, payload)

        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "normal delegateOut should success")
    })
    it("T4 second delegateOut", async ()=>{
        // delegateOut
        let payload = skb.coinContract.delegateOut.getData(newAddr)
        let txhash = await skb.sendStakeTransaction(0, payload)

        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "second delegateOut should fail")
    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
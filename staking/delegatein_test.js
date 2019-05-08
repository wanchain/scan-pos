'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');

const skb = require('./stakebase.js')
let passwd = "wanglu"



describe('delegateIn test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
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
        assert(status == '0x1', "stakeIn failed")
    })
    it("T0 value<100 delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 99
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "value<100 delegateIn should fail")

    })

    it("T1 invalidInput delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData("0x88998")
        payload = payload.slice(0,16)
        console.log("payload: ", payload)
        let tranValue = 140
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("delegateOut tx:", txhash)
            assert(false, "invalidAddr delegateIn should fail")
        }catch(err){
            console.log(err.toString())
            assert(err.toString() == 'Error: delegateIn verify failed', "invalidAddr delegateIn should fail")
        }
    })
    it("T2 none-exist address delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData("0x80000000000000000000000000000000000000d2")
        let tranValue = 140
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "none-exist delegateIn should fail")

    })
    it("T3 Normal delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 140
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "delegateIn failed")
    })
    it("T4 second delegatein value<100 delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 66
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "second delegatein value<100 delegateIn should success")
    })
    it("T5  delegatein value>5*amount delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 400000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "second delegatein value=4*amount delegateIn should success")

        payload = skb.coinContract.delegateIn.getData(newAddr)
        tranValue = 100000
        txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "second delegatein value>5*amount delegateIn should fail")

    })
    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
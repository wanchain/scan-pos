'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const skb = require('./stakebase.js')
const assert = require('assert');

const coder = require('web3/lib/solidity/coder');

function checkDelegateOutReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "delegateOut log failed")
    assert(rec.logs[0].topics.length === 3, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('delegateOut',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")

}
describe('record stakeout test', async ()=> {
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
        let feeRate = 7900

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeIn failed")
    })

    it("T0 Normal stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 0)
        let txhash = await skb.sendStakeTransaction(0, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeUpdate failed")
    })
    it("T3 normal delegateOut", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 140
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "delegateIn failed")


        // delegateOut
        payload = skb.coinContract.delegateOut.getData(newAddr)
        txhash = await skb.sendStakeTransaction(0, payload)

        log.info("delegateOut tx:", txhash)
        rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "normal delegateOut should success")
    })

    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
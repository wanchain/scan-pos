'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"
const coder = require('web3/lib/solidity/coder');

function checkStakeUpdateReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "stakeAppend log failed")
    assert(rec.logs[0].topics.length === 4, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('stakeUpdate',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("int", t.lockTime), "topic  failed")
    assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")

}
describe('stakeUpdate test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
        // log.info("skb.coinbase(): ", skb.coinbase())
        // newAddr = await skb.newAccount();
        // log.info("newAddr: ", newAddr)
        // let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        // let secpub = pubs[0]
        // let g1pub = pubs[1]
        //
        // let lockTime = 7
        // let feeRate = 79
        //
        // // add validator
        // let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        // let tranValue = 100000
        // let txhash = await skb.sendStakeTransaction(tranValue, payload)
        //
        // log.info("stakeUpdate tx:", txhash)
        // let rec = await skb.checkTxResult(txhash)
        // assert(rec.status == '0x1', "stakeAppend failed")
    })
    it("T0 Normal stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 12)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(0, payload)

        console.log("tx5=" + txhash)

        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeUpdate failed")
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
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "none-exist address stakeUpdate failed")
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
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime==7 stakeUpdate failed")
    })
    it("T24 lockTime==90 stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 90)
        let txhash = await skb.sendStakeTransaction(0, payload)

        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime==90 stakeUpdate failed")
    })
    it("T25  lockTime == 0 stakeUpdate", async ()=>{
        let newAddr = "0xb42e7abfa67b26584ba174387dc874551673a9fa"
        let payload = skb.coinContract.stakeUpdate.getData(newAddr, 0)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(0, payload)


        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime == 0 stakeUpdate failed.")
    })
    it("TCP Normal stakeUpdate, check probability", async ()=>{
        // stakein first
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);
        let tranValue = 50000
        let feeRate = 9000
        let lockTime = 90
        let validatorStakeAmount = web3.toBigNumber(web3.toWei(50000)).mul(skb.getWeight(lockTime))
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakein failed")
        let totalAmount = web3.toBigNumber(0)
        let totalStakeAmount = web3.toBigNumber(0)
        async function stakeUpdateOne(t) {
            let payload = skb.coinContract.stakeUpdate.getData(newAddr, t.lockTime)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)

            log.info("stakeUpdate tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == t.status, "stakeUpdate failed")
            if(t.status == '0x0') return

            checkStakeUpdateReceipt(rec,t, newAddr)
            let staker = await skb.getStakeInfobyAddr(newAddr);
            //console.log(staker)
            assert(staker.lockEpochs == lockTime, "failed stakeUpdate in")
            assert(staker.nextLockEpochs == t.lockTime, "failed stakeUpdate in")
        }
        let ts = [
            [7,'0x1'],
            [46,'0x1'],
            [90,'0x1'],
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.lockTime = ts[i][0]
            t.status = ts[i][1]
            await stakeUpdateOne(t)
        }
    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

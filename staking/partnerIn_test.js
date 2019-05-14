'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')


describe('partnerIn test', async ()=> {
    let newAddr
    let lockTime = 7
    before("", async () => {
        await skb.Init()

        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, skb.passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let feeRate = 79

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 50000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "stakein failed")
    })
    it("T0 Normal partnerIn", async ()=>{
        // append validator
        let tranValue = 93
        let payload = skb.coinContract.partnerIn.getData(newAddr, true)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("partnerIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "partnerIn failed")
    })
    it("T1 invalidAddr partnerIn", async ()=>{
        // append validator
        let tranValue = 93
        let payload = skb.coinContract.partnerIn.getData("0x9988", true)
        payload = payload.slice(0,16)
        console.log("payload: ", payload)
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("partnerIn tx:", txhash)
            assert(false, "invalidAddr partnerIn failed")
        }catch(err){
            console.log(err.toString())
            assert(err.toString().indexOf('Error: partnerIn verify failed') == 0 , "invalidAddr partnerIn should failed")
        }
    })
    it("T2 none-exist address partnerIn", async ()=>{
        // append validator
        let tranValue = 93
        let payload = skb.coinContract.partnerIn.getData("0x90000000000000000000000000000000000000d2", true)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("partnerIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "none-exist address partnerIn failed")
    })
    ////////////////////
    it("T3 more than 5 partnerIn", async ()=>{
        // append validator
        let tranValue = 93
        let payload = skb.coinContract.partnerIn.getData("0x90000000000000000000000000000000000000d2")
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("partnerIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "none-exist address partnerIn failed")
    })
    it("T4 Normal partnerIn, no renewal", async ()=>{
        // append validator
        let tranValue = 40093
        let renew = false
        let payload = skb.coinContract.partnerIn.getData(newAddr, renew)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("partnerIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "partnerIn failed")

        let staker = await skb.getStakeInfobyAddr(newAddr);
        console.log(staker)
        assert(staker.Partners.length == 1, "failed partner in")
        assert(staker.Partners[0].Renewal == renew, "failed partner in")
        assert(staker.Partners[0].StakeAmount.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed partner in")
        assert(staker.Partners[0].Amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed partner in")

    })
    it("T5 Normal partnerIn, no renewal, totalProbability <=5*partner ", async ()=>{
        // append validator
        let tranValue = 50000
        let renew = false
        let payload = skb.coinContract.partnerIn.getData(newAddr, renew)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("partnerIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "partnerIn failed")



        let staker = await skb.getStakeInfobyAddr(newAddr);
        console.log(staker)
        assert(staker.Partners.length == 1, "failed partner in")
        assert(staker.Partners[0].Renewal == renew, "failed partner in")
        assert(staker.Partners[0].StakeAmount.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed partner in")
        assert(staker.Partners[0].Amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed partner in")


        payload = skb.coinContract.delegateIn.getData(newAddr)
        tranValue = 400000
        txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "delegateIn failed")


    })

    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
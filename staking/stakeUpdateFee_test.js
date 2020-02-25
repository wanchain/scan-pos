'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"
const coder = require('web3/lib/solidity/coder');

function checkStakeUpdateFeeReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "stakeAppend log failed")
    assert(rec.logs[0].topics.length === 4, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('stakeUpdateFeeRate',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("int", t.feeRate), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")

}
describe('stakeUpdateFeeRate test', async ()=> {
    let newAddr = "0x4843dd1d295bd34c522964be0f6dee413ddd0b3a"
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 7900

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeAppend failed")
    })
    it("T0 Normal stakeUpdateFeeRate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdateFeeRate.getData(newAddr, 7000)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(0, payload)

        console.log("tx5=" + txhash)

        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeUpdate failed")

        let options = {
            fromBlock: 0,
            toBlock: 'latest',
            address:"0x00000000000000000000000000000000000000da",
            topics: [skb.getEventHash('stakeUpdateFeeRate',skb.cscDefinition),
                '0x'+coder.encodeParam("address", skb.coinbase()),
                '0x'+coder.encodeParam("address", newAddr),
                '0x'+coder.encodeParam("int256", 7000)]
        }
        let filter = web3.eth.filter(options);
        let events = await pu.promisefy(filter.get,[],filter);
        console.log("T0 Normal stakeUpdateFeeRate:",events)

    })



    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})





describe('stakeUpdateFeeRate test', async ()=> {
    let newAddr = "0x4843dd1d295bd34c522964be0f6dee413ddd0b3a"
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 7900

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeAppend failed")
    })


    it("D2T0 none-exist address stakeUpdate", async ()=>{
        let payload = skb.coinContract.stakeUpdateFeeRate.getData("0x9000000000000000000000000000000000001111", 12)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(0, payload)


        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "none-exist address stakeUpdate failed")
    })



    it("D2T2 decreate stakeUpdateFeeRate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdateFeeRate.getData(newAddr, 6000)
        try {
            let txhash = await skb.sendStakeTransaction(0, payload)
            log.info("stakeUpdate tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == '0x1', "decreate stakeUpdateFeeRate failed")
        }catch(err){
            console.log("T21 decreate stakeUpdateFeeRate",err.toString())
            assert(err.toString().indexOf('Error: stakeUpdate verify failed') == 0, "lockTime==6 stakeUpdate should fail")
        }
        let staker = await skb.getStakeInfobyAddr(newAddr);
        assert(staker.feeRate==6000, "6000 failed")
        assert(staker.maxFeeRate== 7900, "maxFeeRate failed")
        console.log(staker)
    })



    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})



describe('stakeUpdateFeeRate test', async ()=> {
    let newAddr = "0x4843dd1d295bd34c522964be0f6dee413ddd0b3a"
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 7900

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeAppend failed")
    })


    it("T23 feeRatee==8000 over maxFeeRate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdateFeeRate.getData(newAddr, 8000)
        let txhash = await skb.sendStakeTransaction(0, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "increate stakeUpdateFeeRate 1% failed")
    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})


describe('stakeUpdateFeeRate test', async ()=> {
    let newAddr = "0x4843dd1d295bd34c522964be0f6dee413ddd0b3a"
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 9999

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeAppend failed")
    })

    it("T24 feeRatee==10000 stakeUpdate", async ()=>{

        // update validator
        let payload = skb.coinContract.stakeUpdateFeeRate.getData(newAddr, 10000)
        let txhash = await skb.sendStakeTransaction(0, payload)

        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "feeRatee==10000 stakeUpdateFeeRate failed")

    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})


describe('stakeUpdateFeeRate test', async ()=> {
    let newAddr = "0x4843dd1d295bd34c522964be0f6dee413ddd0b3a"
    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 7900

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakeUpdate tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeAppend failed")
    })


    it("TCP Normal stakeUpdate, check probability", async ()=>{
        // stakein first
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        let contractDef = web3.eth.contract(skb.cscDefinition);
        let tranValue = 50000
        let feeRate = 9000
        let lockTime = 90
        let validatorStakeAmount = web3.toBigNumber(web3.toWei(50000)).mul(skb.getWeight(lockTime))
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakein failed")
        let totalAmount = web3.toBigNumber(0)
        let totalStakeAmount = web3.toBigNumber(0)
        async function stakeUpdateFeeRateOne(t) {
            let payload = skb.coinContract.stakeUpdateFeeRate.getData(newAddr, t.feeRate)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)

            log.info("stakeUpdateFeeRate tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == t.status, "stakeUpdateFeeRate failed")
            if(t.status == '0x0') return

            checkStakeUpdateFeeReceipt(rec,t, newAddr)
            let staker = await skb.getStakeInfobyAddr(newAddr);
            //console.log(staker)
            assert(staker.feeRate == t.feeRate, "failed stakeUpdateFeeRate in")
            let options = {
                fromBlock: 0,
                toBlock: 'latest',
                address:"0x00000000000000000000000000000000000000da",
                topics: [skb.getEventHash('stakeUpdateFeeRate',skb.cscDefinition),
                    '0x'+coder.encodeParam("address", skb.coinbase()),
                    '0x'+coder.encodeParam("address", newAddr),
                    '0x'+coder.encodeParam("int256", t.feeRate)]
            }
            let filter = web3.eth.filter(options);
            let events = await pu.promisefy(filter.get,[],filter);
            console.log("T0 Normal partnerIn:",events)
        }
        let ts = [
            [6000,'0x1'],
            [7000,'0x0'],
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.feeRate = ts[i][0]
            t.status = ts[i][1]
            await stakeUpdateFeeRateOne(t)
        }
    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

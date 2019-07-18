'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const assert = require('assert');

const skb = require('./stakebase.js')

const coder = require('web3/lib/solidity/coder');

function checkDelegateInReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "delegateIn log failed")
    assert(rec.logs[0].topics.length === 4, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('delegateIn',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("int256", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")

}

describe('delegateIn test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
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

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "delegateIn failed")
    })
    it("T0 value<100 delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 99
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "value<100 delegateIn should fail")

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

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "none-exist delegateIn should fail")

    })
    it("T3 Normal delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 140
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "delegateIn failed")
    })
    it("T4 second delegatein value<100 delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 66
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "second delegatein value<100 delegateIn should success")
    })

    it("TCP Normal delegateIn, check probability", async ()=>{
        // stakein first
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, skb.passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);
        let tranValue = 50000
        let feeRate = 90
        let lockTime = 90
        let validatorStakeAmount = web3.toBigNumber(web3.toWei(50000)).mul(skb.getWeight(lockTime))
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakein failed")
        let totalAmount = web3.toBigNumber(0)
        let totalStakeAmount = web3.toBigNumber(0)
        async function delegateInOne(t) {
            let payload = skb.coinContract.delegateIn.getData(newAddr)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)

            log.info("delegateIn tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            console.log(rec)
            assert(rec.status == t.status, "delegateIn failed")
            if(t.status == '0x0') return
            checkDelegateInReceipt(rec, t, newAddr)

            let staker = await skb.getStakeInfobyAddr(newAddr);
            //console.log(staker)
            assert(staker.lockEpochs == lockTime, "failed delegateIn")
            assert(staker.nextLockEpochs == lockTime, "failed delegateIn")
            assert(staker.votingPower.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed delegateIn")
            assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed delegateIn")

            assert(staker.clients.length == 1, "delegatein failed")
            assert(staker.clients[0].address == skb.coinbase(), "delegate failed")

            let amount =web3.toWei(web3.toBigNumber(t.tranValue))
            totalAmount = totalAmount.add(amount)
            console.log(staker.clients[0].amount.toString(10))
            console.log(totalAmount.toString(10))
            assert(staker.clients[0].amount.cmp(totalAmount)==0, "delegate failed")
            let votingPower =web3.toWei(web3.toBigNumber(t.tranValue)).mul(skb.getWeight(skb.minEpoch))
            totalStakeAmount = totalStakeAmount.add(votingPower)
            assert(staker.clients[0].votingPower.cmp(totalStakeAmount)==0, "delegate failed")

            let epb = await skb.getEpochStakerInfo(Number(staker.stakingEpoch), newAddr)
            console.log(epb)
            assert(epb.Infors.length == 2,"delegate failed")
            console.log(totalStakeAmount.toString(10))
            console.log(web3.toBigNumber(epb.Infors[1].Probability).toString(10))

            assert(web3.toBigNumber(epb.Infors[1].Probability).cmp(totalStakeAmount) == 0,"delegate failed")
            let allStakeAmount = validatorStakeAmount.add(totalStakeAmount)
            assert(web3.toBigNumber(epb.TotalProbability).cmp(allStakeAmount)==0,"delegate failed")
            try {
                let epe = await skb.getEpochStakerInfo(Number(staker.stakingEpoch)+lockTime, newAddr)
                console.log(epe)
                assert(false, "last epoch, the probability shuold be empty")
            }catch{
            }
        }
        let ts = [
            [20,'0x0'],
            [120,'0x1'],
            [140,'0x1'],
            [320,'0x1'],
            [420,'0x1'],
            [99,'0x1'],
            [520,'0x1']
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.tranValue = ts[i][0]
            t.status = ts[i][1]
            await delegateInOne(t)
        }
    })
    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

describe('delegateIn test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
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

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "delegateIn failed")
    })
    it("TM  delegatein value>10*amount delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 999900
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "second delegatein value=4*amount delegateIn should success")

        payload = skb.coinContract.delegateIn.getData(newAddr)
        tranValue = 101
        txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "second delegatein value>5*amount delegateIn should fail")

    })
    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

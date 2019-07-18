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
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeIn failed")
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
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "non-exist  delegateOut should fail")
    })

    it("T2 msgfrom non-exist delegateOut", async ()=>{

        // delegateOut
        let payload = skb.coinContract.delegateOut.getData(newAddr)
        let txhash = await skb.sendStakeTransaction(0, payload)


        log.info("delegateOut tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "msgfrom non-exist delegateOut should fail")
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

        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "normal delegateOut should success")
    })
    it("T4 second delegateOut", async ()=>{
        // delegateOut
        let payload = skb.coinContract.delegateOut.getData(newAddr)
        let txhash = await skb.sendStakeTransaction(0, payload)

        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "second delegateOut should fail")
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

        payload = skb.coinContract.delegateIn.getData(newAddr)
        let dtranValue = 140
        txhash = await skb.sendStakeTransaction(dtranValue, payload)

        log.info("delegateIn tx:", txhash)
        rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "delegateIn failed")


        let totalAmount = web3.toBigNumber(0)
        let totalStakeAmount = web3.toBigNumber(0)
        async function delegateOutOne(t) {
            let payload = skb.coinContract.delegateOut.getData(newAddr)
            let txhash = await skb.sendStakeTransaction(0, payload)

            log.info("delegateOut tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            console.log(rec)
            assert(rec.status == t.status, "delegateOut failed")
            if(t.status == '0x0') return
            checkDelegateOutReceipt(rec, t, newAddr)

            let staker = await skb.getStakeInfobyAddr(newAddr);
            //console.log(staker)
            assert(staker.lockEpochs == lockTime, "failed delegateOut")
            assert(staker.nextLockEpochs == lockTime, "failed delegateOut")
            assert(staker.votingPower.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed delegateOut")
            assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed delegateOut")

            assert(staker.clients.length == 1, "delegateOut failed")
            assert(staker.clients[0].address == skb.coinbase(), "delegateOut failed")

            let amount =web3.toWei(web3.toBigNumber(dtranValue))
            totalAmount = totalAmount.add(amount)
            console.log(staker.clients[0].amount.toString(10))
            console.log(totalAmount.toString(10))
            assert(staker.clients[0].amount.cmp(totalAmount)==0, "delegateOut failed")
            let votingPower =web3.toWei(web3.toBigNumber(dtranValue)).mul(skb.getWeight(skb.minEpoch))
            totalStakeAmount = totalStakeAmount.add(votingPower)
            assert(staker.clients[0].votingPower.cmp(totalStakeAmount)==0, "delegateOut failed")

            let epb = await skb.getEpochStakerInfo(Number(staker.stakingEpoch), newAddr)
            console.log(epb)
            assert(epb.Infors.length == 1,"delegate failed")

            assert(web3.toBigNumber(epb.Infors[0].Probability).cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime)))) == 0,"delegateOut failed")
            assert(web3.toBigNumber(epb.TotalProbability).cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0,"delegateOut failed")
            try {
                let epe = await skb.getEpochStakerInfo(Number(staker.stakingEpoch)+lockTime, newAddr)
                console.log(epe)
                assert(false, "last epoch, the probability shuold be empty")
            }catch{
            }
        }
        let ts = [
            ['0x1'],
            ['0x0']
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.status = ts[i][0]
            await delegateOutOne(t)
        }
    })

    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
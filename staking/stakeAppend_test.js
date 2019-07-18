'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
const coder = require('web3/lib/solidity/coder');

function checkStakeAppendReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "stakeAppend log failed")
    assert(rec.logs[0].topics.length === 4, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('stakeAppend',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("int256", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")

}
describe('stakeAppend test', async ()=> {
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
        let rec = await skb.checkTxResult(txhash)  })
    it("T0 send from another account stakeAppend", async ()=>{
        // append validator
        let tranValue = 39000
        let payload = skb.coinContract.stakeAppend.getData(newAddr)
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakeAppend tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "stakeAppend from another account should fail")

    })
    it("T1 invalidAddr stakeAppend", async ()=>{
        // append validator
        let tranValue = 93
        let payload = skb.coinContract.stakeAppend.getData("0x9988")
        payload = payload.slice(0,16)
        console.log("payload: ", payload)
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeAppend tx:", txhash)
            assert(false, "invalidAddr stakeAppend failed")
        }catch(err){
            //console.log(err.toString())
            assert(err.toString().indexOf('Error: stakeAppend verify failed') == 0 , "invalidAddr stakeAppend should failed")
        }
    })
    it("T2 none-exist address stakeAppend", async ()=>{
        // append validator
        let tranValue = 93
        let payload = skb.coinContract.stakeAppend.getData("0x0000000000000000000000000000000000000011")
        console.log("payload: ", payload)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "none-exist address stakeAppend failed")
    })
    it("TCP Normal stakeAppend, check probability", async ()=>{
        // stakein first
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, skb.passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000da";
        let coinContract = contractDef.at(cscContractAddr);
        let tranValue = 50000
        let feeRate = 9000
        let lockTime = 90
        let validatorStakeAmount = web3.toBigNumber(web3.toWei(50000)).mul(skb.getWeight(lockTime))
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakein failed")
        let totalAmount = web3.toWei(web3.toBigNumber(tranValue))
        let totalStakeAmount = web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime)))
        async function stakeAppendOne(t) {
            let payload = skb.coinContract.stakeAppend.getData(newAddr)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)

            log.info("stakeAppend tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == t.status, "stakeAppend failed")
            if(t.status == '0x0') return
            checkStakeAppendReceipt(rec, t, newAddr)

            let staker = await skb.getStakeInfobyAddr(newAddr);
            assert(staker.lockEpochs == lockTime, "failed stakeAppend ")
            assert(staker.nextLockEpochs == lockTime, "failed stakeAppend ")
            totalStakeAmount = totalStakeAmount.add(web3.toWei(web3.toBigNumber(t.tranValue).mul(skb.getWeight(lockTime))))
            console.log(staker.votingPower)
            console.log(totalStakeAmount)
            assert(staker.votingPower.cmp(totalStakeAmount)==0, "failed stakeAppend")
            totalAmount = totalAmount.add(web3.toWei(web3.toBigNumber(t.tranValue)))
            assert(staker.amount.cmp(totalAmount)==0, "failed stakeAppend")

            let epb
            try {
                epb = await skb.getEpochStakerInfo(Number(staker.stakingEpoch), newAddr)
            }catch(err){
                console.log("getEpochStakerInfo:", err)
            }
            console.log(epb)
            log.info(4)

            try {
                let epe = await skb.getEpochStakerInfo(Number(staker.stakingEpoch)+t.lockTime, newAddr)
                console.log(epe)
                assert(false, "last epoch, the probability shuold be empty")
            }catch{
            }

            let options = {
                fromBlock: 0,
                toBlock: 'latest',
                address:"0x00000000000000000000000000000000000000da",
                topics: [skb.getEventHash('stakeAppend',skb.cscDefinition),
                    '0x'+coder.encodeParam("address", skb.coinbase()),
                    '0x'+coder.encodeParam("address", newAddr),
                    '0x'+coder.encodeParam("int256", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16))]
            }
            let filter = web3.eth.filter(options);
            let events = await pu.promisefy(filter.get,[],filter);
            console.log("Ti Normal partnerIn:",events)
        }
        let ts = [
            [700,'0x1'],
            [4600,'0x1'],
            [9000,'0x1'],
            [9100,'0x1']
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.tranValue = ts[i][0]
            t.status = ts[i][1]
            await stakeAppendOne(t)
        }

    })

    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
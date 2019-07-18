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
    let u = [
        "0xcf696d8eea08a311780fb89b20d4f0895198a489",
        "0x8b179c2b542f47bb2fb2dc40a3cf648aaae1df16",
        ]
    let cpv = []
    let cpd = 0
    let t = [
        {
            lockTime: 7,
            tranValue: 70000,
            feeRate: 9700
        },
        {
            lockTime: 8,
            tranValue: 80000,
            feeRate: 9800
        },
        {
            lockTime: 9,
            tranValue: 90000,
            feeRate: 9900
        }
    ]

    before("", async () => {
        await skb.Init()
        log.info("skb.coinbase(): ", skb.coinbase())
        let epochID = await web3.pos.getEpochID()
        cpd = epochID+3
        for(let i=0; i<t.length; i++){
            cpv.push(epochID +t[i].lockTime+2)
        }
        console.log("cpv:", cpv)
        console.log("epochID:", epochID)

    })
    it("T0 Normal stakeIn", async ()=>{

        for(let i=0; i<t.length; i++) {
            let newAddr = await skb.stakeInNew(t[i])
            console.log("newAddr:", newAddr)
            t[i].validatorAddr = newAddr
        }

    })
    it("T1 normal delegateIn", async ()=>{

        for(let k=0; k<u.length; k++){
            for(let i=0; i<t.length; i++) {
                let payload = skb.coinContract.delegateIn.getData(t[i].validatorAddr)
                let tranValue = 140
                let txhash = await skb.sendStakeTransaction(tranValue, payload, u[k])

                log.info("delegateIn tx:", txhash)
                let rec = await skb.checkTxResult(txhash)
                assert(rec.status == '0x1', "delegateIn failed")
            }
        }
    })
    it("T2 normal delegateOut", async ()=>{

        let from = u[0]
        for(let i=0; i<t.length; i++) {
            let payload = skb.coinContract.delegateOut.getData(t[i].validatorAddr)
            let txhash = await skb.sendStakeTransaction(0, payload, from)

            log.info("delegateOut tx:", txhash)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == '0x1', "normal delegateOut should success")
        }
    })
    it("T3 Normal stakeUpdate", async ()=>{
        for(let i=0; i<t.length; i++) {
            t[i].lockTime = 0
            await skb.stakeUpdate(t[i])
        }
    })


    after("end",async ()=>{
        console.log("end")
        let ub = new Array(u.length)
        for(let k=0; k<u.length; k++){
            ub[k] = await web3.eth.getBalance(u[k])
        }

        let epochID = await web3.pos.getEpochID()
        while(epochID <= cpv[cpv.length-1]){
            console.log("epochID:", epochID)
            try {
                let dinfo = await web3.pos.getEpochStakeOut(epochID)
                console.log("dinfo:", dinfo)

                if(epochID == cpd){
                    //assert(dinfo.length, 3, "delegateout should 3")
                } else {
                    for(let i=0; i<t.length; i++){
                        if(epochID == cpv[i]){
                            //assert(dinfo.length, 2, "stakeout should 2")
                        }
                    }
                }
            }catch(err){

            }

            await pu.sleep(1000 * 12 * 1 * 6)
            epochID = await web3.pos.getEpochID()
        }

        //process.exit(0)
    })
})
'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
const coder = require('web3/lib/solidity/coder');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"

let cscContractAddr = "0x00000000000000000000000000000000000000da";


function checkStakeInReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "stakeRegister log failed")
    //assert(rec.logs[0].topics.length === 6, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('stakeRegister',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")
    assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("int256", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)), "topic  failed")
    assert(rec.logs[0].data === '0x'+coder.encodeParams(["int256","int256","int256"], [t.feeRate,t.lockTime,t.maxFeeRate]), "topic data failed")
    // assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("int", t.feeRate), "topic  failed")
    // assert(rec.logs[0].topics[4] === '0x'+coder.encodeParam("int", t.lockTime), "topic  failed")
}



async function sendOne(t) {
    let txhash = await pu.promisefy(web3.personal.sendTransaction, [{from:'0x29c9cc023a7cc3a867153ba7bd86f7ad7ec96128', to:t.validatorAddr, value: web3.toWei(1000)}, passwd], web3.personal)
    console.log(txhash);
}

describe('stakeRegister test', ()=> {
    let maxFeeRate = 9900
    before(async () => {
        await skb.Init()
    })
    it("T00 Normal stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        //let newAddr = "0x23fc2eda99667fd3df3caa7ce7e798d94eec06eb"
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 9700
        let maxFeeRate = 9900

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate, maxFeeRate)
        //let tranValue = 100000
        let tranValue = 100000
        log.info("tranValue:",tranValue)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakeRegister failed")

        let staker = await skb.getStakeInfobyAddr(newAddr);
        console.log(staker)
        assert(staker.lockEpochs == lockTime, "failed stakeRegister in")
        assert(staker.nextLockEpochs == lockTime, "failed stakeRegister in")
        assert(staker.votingPower.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed stakeRegister in")
        assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed stakeRegister in")

    })
    it("T01 bad secpub when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub_r = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////
        let secpub =  secpub_r.slice(0,2) + 0x13 + secpub_r.slice(3)// change a byte

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79
        let maxFeeRate = 9900

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "bad secpub when stakeRegister failed")
        }catch(err){
            console.log("bad secpub", err.toString())
            assert(err.toString() == 'Error: stakeRegister verify failed', "bad secpub when stakeRegister failed")
        }
    })

    it("T02 bad bn256pub when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub_r = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////
        let g1pub =  g1pub_r.slice(0,2) + 0x13 + g1pub_r.slice(3)// change a byte

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79
        let maxFeeRate = 9900

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "bad bn256pub when stakeRegister failed")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "bad bn256pub when stakeRegister failed")
        }
    })

    it("T03 feeRate=10000 when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "feeRate=10000 when stakeRegister failed")
    })
    it("T4 feeRate=0 when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 0
        let maxFeeRate = 9900

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "feeRate=0 when stakeRegister failed")
    })
    it("T5 feeRate<0 when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = -1
        let maxFeeRate = 9900

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "feeRate<0 when stakeRegister failed")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "feeRate<0 when stakeRegister failed")
        }
    })
    it("T6 feeRate>10000 when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10001
        let maxFeeRate = 19900

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "feeRate>100 when stakeRegister failed")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "feeRate>100 when stakeRegister failed")
        }
    })
    it("T7 one secpk regist twice when stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "regist first failed")

        txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "register twice should fail")
    })
    it("T10 value< 10000 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 9999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "value< 10000 stakeRegister failed")
    })
    it("T11 value<100000&&feeRate!=100 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "value<100000&&feeRate!=100 stakeRegister need success, but will not work.")
    })
    it("T12 value<100000&&feeRate==100 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000
        let maxFeeRate = 10000
        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "value<100000&&feeRate=100 stakeRegister failed")
    })
    it("T13 value<10000&&feeRate==100 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 9999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "value<100000&&feeRate=100 stakeRegister failed")
    })


    it("T14 lockTime==7 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime==7 stakeRegister failed")
    })

    it("T15 lockTime==90 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 90
        let feeRate = 10000
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakeRegister tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime==90 stakeRegister failed")
    })

    it("T16 lockTime==6 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 6
        let feeRate = 10000
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "lockTime==6  stakeRegister failed")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "lockTime==6  stakeRegister failed")
        }
    })

    it("T17 lockTime==91 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 91
        let feeRate = 10000
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "lockTime==91 stakeRegister should except")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "lockTime==91 stakeRegister failed")
        }
    })
    it("T20 feeRate|feeRate==10000 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 91
        let feeRate = 9900
        let maxFeeRate = 10000

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "lockTime==91 stakeRegister should except")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "lockTime==91 stakeRegister failed")
        }
    })
    it("T21 feeRate|feeRate==10000 stakeRegister", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 91
        let feeRate = 10000
        let maxFeeRate = 9999

        // add validator
        let payload = coinContract.stakeRegister.getData(secpub, g1pub, lockTime, feeRate,maxFeeRate)
        let tranValue = 99999
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakeRegister tx:", txhash)
            assert(false, "lockTime==91 stakeRegister should except")
        }catch(err){
            assert(err.toString() == 'Error: stakeRegister verify failed', "lockTime==91 stakeRegister failed")
        }
    })
    it("TCP Normal stakeRegister, check probability", async ()=>{
        async function stakeRegisterOne(t) {
            let newAddr = await skb.newAccount();
            //let newAddr = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e"
            log.info("newAddr: ", newAddr)
            let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
            let secpub = pubs[0]
            let g1pub = pubs[1]
            let contractDef = web3.eth.contract(skb.cscDefinition);
            let coinContract = contractDef.at(cscContractAddr);
            let payload = coinContract.stakeRegister.getData(secpub, g1pub, t.lockTime, t.feeRate, t.maxFeeRate)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == t.status, "stakeRegister failed")
            if(t.status == '0x0') return
            checkStakeInReceipt(rec, t, newAddr)
            log.info(2)
            let staker = await skb.getStakeInfobyAddr(newAddr);
            console.log(staker)
            assert(staker.lockEpochs == t.lockTime, "failed stakeRegister in")
            assert(staker.nextLockEpochs == t.lockTime, "failed stakeRegister in")
            assert(staker.votingPower.cmp(web3.toWei(web3.toBigNumber(t.tranValue).mul(skb.getWeight(t.lockTime))))==0, "failed stakeRegister in")
            assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(t.tranValue)))==0, "failed stakeRegister in")
            log.info(3)
            console.log("typeof staker.StakingEpoch", typeof(staker.stakingEpoch))

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
        }
        let ts = [
            [7, 10000, 10000,12000,'0x1'],
            [9, 10000,10000, 12000,'0x1'],
            [16, 10000, 10000,32000,'0x1'],
            [27, 10000,10000, 22000,'0x1'],
            [27, 10, 10,2000,'0x0'],
            [90, 10000,10000, 12000,'0x1']
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.lockTime = ts[i][0]
            t.feeRate = ts[i][1]
            t.maxFeeRate = ts[i][2]
            t.tranValue = ts[i][3]
            t.status = ts[i][4]
            await stakeRegisterOne(t)
        }
        let options = {
            fromBlock: 0,
            toBlock: 'latest',
            address:"0x00000000000000000000000000000000000000da",
            topics: [null]
        }
        let filter = web3.eth.filter(options);
        let events = await pu.promisefy(filter.get,[],filter);
        console.log(events)
    })



    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

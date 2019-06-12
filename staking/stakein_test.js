'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
const coder = require('web3/lib/solidity/coder');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"



function checkStakeInReceipt(rec, t, newAddr) {
    assert(rec.logs.length == 1, "stakein log failed")
    assert(rec.logs[0].topics.length === 6, "topic length failed")
    console.log(rec.logs[0].topics)
    console.log('0x'+coder.encodeParam("bytes32", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)))
    assert(rec.logs[0].topics[0] === skb.getEventHash('stakeIn',skb.cscDefinition), "topic  failed")
    assert(rec.logs[0].topics[1] === '0x'+coder.encodeParam("address", skb.coinbase()), "topic  failed")
    assert(rec.logs[0].topics[2] === '0x'+coder.encodeParam("int256", '0x'+web3.toWei(web3.toBigNumber(t.tranValue)).toString(16)), "topic  failed")
    assert(rec.logs[0].topics[3] === '0x'+coder.encodeParam("int", t.feeRate), "topic  failed")
    assert(rec.logs[0].topics[4] === '0x'+coder.encodeParam("int", t.lockTime), "topic  failed")
    assert(rec.logs[0].topics[5] === '0x'+coder.encodeParam("address", newAddr), "topic  failed")
}

async function stakeInOne(t) {
    let pubs = await pu.promisefy(web3.personal.showPublicKey, [t.validatorAddr, passwd], web3.personal)
    let secpub = pubs[0]
    console.log("regist:", t.validatorAddr, secpub)
    let g1pub = pubs[1]
    let contractDef = web3.eth.contract(skb.cscDefinition);
    let cscContractAddr = "0x00000000000000000000000000000000000000d2";
    let coinContract = contractDef.at(cscContractAddr);
    let payload = coinContract.stakeIn.getData(secpub, g1pub, t.lockTime, t.feeRate)
    let txhash = await skb.sendStakeTransaction(t.tranValue, payload)
    return
    let rec = await skb.checkTxResult(txhash)
    assert(rec.status == t.status, "stakein failed")
    if(t.status == '0x0') return
    checkStakeInReceipt(rec, t, t.validatorAddr)
    let staker = await skb.getStakeInfobyAddr(t.validatorAddr);
    console.log(staker)
    assert(staker.lockEpochs == t.lockTime, "failed stakein in")
    assert(staker.nextLockEpochs == t.lockTime, "failed stakein in")
    assert(staker.stakeAmount.cmp(web3.toWei(web3.toBigNumber(t.tranValue).mul(skb.getWeight(t.lockTime))))==0, "failed stakein in")
    assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(t.tranValue)))==0, "failed stakein in")
    console.log("typeof staker.StakingEpoch", typeof(staker.stakingEpoch))

    let epb
    try {
        epb = await skb.getEpochStakerInfo(Number(staker.stakingEpoch), t.validatorAddr)
    }catch(err){
        console.log("getEpochStakerInfo:", err)
    }
    console.log(epb)

    try {
        let epe = await skb.getEpochStakerInfo(Number(staker.stakingEpoch)+t.lockTime, t.validatorAddr)
        console.log(epe)
        assert(false, "last epoch, the probability shuold be empty")
    }catch(err){
        assert(-1 != err.toString().indexOf("Validator is exiting"), "expired, prompt message is wrong")
    }
}

async function sendOne(t) {
    let txhash = await pu.promisefy(web3.personal.sendTransaction, [{from:'0x29c9cc023a7cc3a867153ba7bd86f7ad7ec96128', to:t.validatorAddr, value: web3.toWei(1000)}, passwd], web3.personal)
    console.log(txhash);
}

describe('stakein test', ()=> {
    before(async () => {
        await skb.Init()
    })
    it("T0 Normal stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        //let tranValue = 100000
        let tranValue = 100000
        log.info("tranValue:",tranValue)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "stakein failed")

        let staker = await skb.getStakeInfobyAddr(newAddr);
        console.log(staker)
        assert(staker.lockEpochs == lockTime, "failed stakein in")
        assert(staker.nextLockEpochs == lockTime, "failed stakein in")
        assert(staker.stakeAmount.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed stakein in")
        assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed stakein in")

    })
    it("T1 bad secpub when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub_r = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////
        let secpub =  secpub_r.slice(0,2) + 0x13 + secpub_r.slice(3)// change a byte

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakein tx:", txhash)
            assert(false, "bad secpub when stakein failed")
        }catch(err){
            assert(err.toString() == 'Error: stakein verify failed', "bad secpub when stakein failed")
        }
    })

    it("T2 bad bn256pub when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub_r = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////
        let g1pub =  g1pub_r.slice(0,2) + 0x13 + g1pub_r.slice(3)// change a byte

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakein tx:", txhash)
            assert(false, "bad bn256pub when stakein failed")
        }catch(err){
            assert(err.toString() == 'Error: stakein verify failed', "bad bn256pub when stakein failed")
        }
    })

    it("T3 feeRate=10000 when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "feeRate=10000 when stakein failed")
    })
    it("T4 feeRate=0 when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 0

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "feeRate=0 when stakein failed")
    })
    it("T5 feeRate<0 when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = -1

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakein tx:", txhash)
            assert(false, "feeRate<0 when stakein failed")
        }catch(err){
            assert(err.toString() == 'Error: stakein verify failed', "feeRate<0 when stakein failed")
        }
    })
    it("T6 feeRate>100 when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10001

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakein tx:", txhash)
            assert(false, "feeRate>100 when stakein failed")
        }catch(err){
            assert(err.toString() == 'Error: stakein verify failed', "feeRate>100 when stakein failed")
        }
    })
    it("T7 one secpk regist twice when stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "regist first failed")

        txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "register twice should fail")
    })
    it("T10 value< 10000 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 9999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "value< 10000 stakein failed")
    })
    it("T11 value<100000&&feeRate!=100 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "value<100000&&feeRate!=100 stakein need success, but will not work.")
    })
    it("T12 value<100000&&feeRate==100 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "value<100000&&feeRate=100 stakein failed")
    })
    it("T13 value<10000&&feeRate==100 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 9999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x0', "value<100000&&feeRate=100 stakein failed")
    })


    it("T14 lockTime==7 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime==7 stakein failed")
    })

    it("T15 lockTime==90 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 90
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let rec = await skb.checkTxResult(txhash)
        assert(rec.status == '0x1', "lockTime==90 stakein failed")
    })

    it("T16 lockTime==6 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 6
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakein tx:", txhash)
            assert(false, "lockTime==6  stakein failed")
        }catch(err){
            assert(err.toString() == 'Error: stakein verify failed', "lockTime==6  stakein failed")
        }
    })

    it("T17 lockTime==91 stakein", async ()=>{
        let newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(skb.cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 91
        let feeRate = 10000

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        try {
            let txhash = await skb.sendStakeTransaction(tranValue, payload)
            log.info("stakein tx:", txhash)
            assert(false, "lockTime==91 stakein should except")
        }catch(err){
            assert(err.toString() == 'Error: stakein verify failed', "lockTime==91 stakein failed")
        }
    })
    it("TCP Normal stakein, check probability", async ()=>{
        async function stakeInOne(t) {
            //let newAddr = await skb.newAccount();
            let newAddr = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e"
            log.info("newAddr: ", newAddr)
            let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
            let secpub = pubs[0]
            let g1pub = pubs[1]
            let contractDef = web3.eth.contract(skb.cscDefinition);
            let cscContractAddr = "0x00000000000000000000000000000000000000d2";
            let coinContract = contractDef.at(cscContractAddr);
            let payload = coinContract.stakeIn.getData(secpub, g1pub, t.lockTime, t.feeRate)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)
            let rec = await skb.checkTxResult(txhash)
            assert(rec.status == t.status, "stakein failed")
            if(t.status == '0x0') return
            checkStakeInReceipt(rec, t, newAddr)
            log.info(2)
            let staker = await skb.getStakeInfobyAddr(newAddr);
            console.log(staker)
            assert(staker.lockEpochs == t.lockTime, "failed stakein in")
            assert(staker.nextLockEpochs == t.lockTime, "failed stakein in")
            assert(staker.stakeAmount.cmp(web3.toWei(web3.toBigNumber(t.tranValue).mul(skb.getWeight(t.lockTime))))==0, "failed stakein in")
            assert(staker.amount.cmp(web3.toWei(web3.toBigNumber(t.tranValue)))==0, "failed stakein in")
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
            [7, 10000, 12000,'0x1'],
            [9, 10000, 12000,'0x1'],
            [16, 10000, 32000,'0x1'],
            [27, 10000, 22000,'0x1'],
            [27, 10, 2000,'0x0'],
            [90, 10000, 12000,'0x1']
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.lockTime = ts[i][0]
            t.feeRate = ts[i][1]
            t.tranValue = ts[i][2]
            t.status = ts[i][3]
            await stakeInOne(t)
        }
    })
    it("T100 register many.", async ()=>{
        let ts = [
            [7, 10000, 100000,"0x8999b737fe811effae3504443d70dbb56592ae19",'0x1'],
            [7, 10000, 100000,"0xd526456dd64aa4997f06544e1c168fc85a3b1e70",'0x1'],
            [7, 10000, 100000,"0x49ca74a69f2931d75b1099354b603d9c12585c25",'0x1'],
            [7, 10000, 100000,"0x6dc27b2b62b8a04fda99efae4de180adc6a14516",'0x1'],
            [7, 10000, 100000,"0x5c56427a58e5beee53580ec23e4d3a2818c000fd",'0x1'],
            [7, 10000, 100000,"0x1d870ed4983f131ac676b776804afc4f43ed5db4",'0x1'],
            [7, 10000, 100000,"0xac66aa78e4438b684cc1b2f791433b84d5673b4d",'0x1'],
            [7, 10000, 100000,"0xc034cbe41f4b861c2c79f454473c26ee47a6706e",'0x1'],
            [7, 10000, 100000,"0x58f88a4be28db5e9c75230d12b973b5df3393e81",'0x1'],
            [7, 10000, 100000,"0x7e1cf50b04fb52a44acf21488748c88e79d1265c",'0x1'],
            [7, 10000, 100000,"0x4ea4ec595eeeef7d0f9bc63260bd16a7665835f1",'0x1'],
            [7, 10000, 100000,"0x56b7b2b58f97dd0a1bcc4bc9d87bf17f5161a1eb",'0x1'],
            [7, 10000, 100000,"0xbb08a0511bd560cd0d2f793001b468426a23f05c",'0x1'],
            [7, 10000, 100000,"0x150897421e39c3affd4445d1cd2e239c6d381b6c",'0x1'],
            [7, 10000, 100000,"0x49c1b00e1525f82e8bb32356679b4ba9ba90ee68",'0x1'],
            [7, 10000, 100000,"0xd35c507ccfe1ec4b9267a19c6120756909a19c7b",'0x1'],
            [7, 10000, 100000,"0x9ab68f865b4b795293ba642a200561c59d3449ed",'0x1'],
            [7, 10000, 100000,"0xee5fec120f3c12c2737de6021399c0b970c5dcfa",'0x1'],
            [7, 10000, 100000,"0xb35d7639dd1b021dd4b8c90ea956d425f58e8d85",'0x1'],
            [7, 10000, 100000,"0xbd7466e074020f66092905e9f049e29ff9f745ed",'0x1'],
            [7, 10000, 100000,"0x119fea9b497f3397443843b5c990431536eac5c8",'0x1'],
            [7, 10000, 100000,"0xb90a208bc132b33f6e2522be8c862ff519fd5f39",'0x1'],
            [7, 10000, 100000,"0xe185926a93e749d1dd79f174699cbe4b11f68e9e",'0x1'],
            [7, 10000, 100000,"0xd88c9515d176500d76e874fae16b4c86a19b49b8",'0x1'],
            [7, 10000, 100000,"0x396105ef5c633781b3743d4f13f470ed4afcbbc1",'0x1'],
            [7, 10000, 100000,"0xc6733864f7ff32a66c80845f102d92a3bfb88387",'0x1'],
            [7, 10000, 100000,"0x7c7d66dcd3c5e63c3be0dc7cd66ddce8fb9bf047",'0x1'],
            [7, 10000, 100000,"0x4d545048c6a9a2452817684cb65b789fbed1be3e",'0x1'],
            [7, 10000, 100000,"0x4c14319b06b6bddc535f9e5c26bace2d9a5ee9ec",'0x1'],
            [7, 10000, 100000,"0x5179937267a1f4c6a146b0d44bf3ccc477e5029d",'0x1'],
            [7, 10000, 100000,"0x01b59d100a9856fcb6e2f9a51daac3d2637f7827",'0x1'],
            [7, 10000, 100000,"0xba92da568845aaf0242a3c16b54e6c0570014b28",'0x1'],
            [7, 10000, 100000,"0x95619528ba577841fe188d74f2b5d679ce19e634",'0x1'],
            [7, 10000, 100000,"0x089e230e169d5e202fd5d6856834aae207aa9612",'0x1'],
            [7, 10000, 100000,"0xb7a901ef228fcb9d0e71e3f198c7156caee4c020",'0x1'],
            [7, 10000, 100000,"0x9a3da1086e18766a5342f777f79f7b0fea755905",'0x1'],
            [7, 10000, 100000,"0xa2a735f34d3a0e1213676ad32a61fe01fa7099e0",'0x1'],
            [7, 10000, 100000,"0xeac983dfcb2aff3ff45e9a88590594ec7cfe57f9",'0x1'],
            [7, 10000, 100000,"0xb49970775cbcd55b8518683f0081ffba8054577d",'0x1'],
            [7, 10000, 100000,"0xcbc759ce42bffac61e52269bdc9cd6deb2f382a5",'0x1'],
            [7, 10000, 100000,"0x158b89dd869c0c9b1964d9cd2d5317c99368a6b8",'0x1'],
            [7, 10000, 100000,"0x792ed0959febc418c5a458f2c17400f2baa91510",'0x1'],
            [7, 10000, 100000,"0xf7a4bfcc8b2956fe45466fed4d254103feea70b4",'0x1'],
            [7, 10000, 100000,"0x05edc5d755e1a79d56e5e006b6e371a040a335ad",'0x1'],
            [7, 10000, 100000,"0x64cac4d0a4b9b727dc1491f1662b0482d1fb3239",'0x1'],
            [7, 10000, 100000,"0x33688c505e703c08f5a6fa6883b6de4eda2ad747",'0x1'],
            [7, 10000, 100000,"0x1831ec2e62a07e32c7895649f84d824125143e1d",'0x1'],
            [7, 10000, 100000,"0xe867cff6f787d0402cfecbf3b8b6aa860dd30bcd",'0x1'],
            [7, 10000, 100000,"0x0488c16bcb322af990c21e7b44f8614d6adc1593",'0x1'],
            [7, 10000, 100000,"0xbf330993ef35b0ff9b90d5cf460dae05778e8a83",'0x1'],
            [7, 10000, 100000,"0x4877581ccab3382f60db8546d692dbf9af09a91b",'0x1'],
            [7, 10000, 100000,"0xb784933acd316ecad28e6f32751b6f7b3603bce3",'0x1'],
            [7, 10000, 100000,"0xc0727d12d154ce24ea412f59aee3e9cf62470e26",'0x1'],
            [7, 10000, 100000,"0xef2ea77ee26912f6eb422f0b48868c0849886d5c",'0x1'],
            [7, 10000, 100000,"0xbc32b9ae4052d042ea51420d063afc2bbb4bf37c",'0x1'],
            [7, 10000, 100000,"0x39def80abacd22ff10a45ce6f9fd73da40685a3d",'0x1'],
            [7, 10000, 100000,"0xe43ffe5b6c9d6d7f583a97c8472f7d13a9a9aab4",'0x1'],
            [7, 10000, 100000,"0x2ba460e8b47596dd2ee6ffedb43316481d9c7a24",'0x1'],
            [7, 10000, 100000,"0x1d8e16263d919146226601bdab9ef033296026e7",'0x1'],
            [7, 10000, 100000,"0xa7354cf22adc9692d3cea9fe7809da83b20b8b9b",'0x1'],
            [7, 10000, 100000,"0x05bf2e314ff40ee708d87ee4a04491697d4400fc",'0x1'],
            // [7, 10000, 100000,"0xb39662d33283645d96a5f23b07b1b51b01238301",'0x1'],
            // [7, 10000, 100000,"0xb538e97cff90842ae9c4ac57656a2e0659d42526",'0x1'],
            // [7, 10000, 100000,"0xeecad74dd7adce4fcd126533316ddd73e44db7ef",'0x1'],
            // [7, 10000, 100000,"0xae0287516970c6dc9451ad9e27da2b8ff4f06c76",'0x1'],
            // [7, 10000, 100000,"0x213fbc132385e63357aeeea5e8e011c500bc863d",'0x1'],
            // [7, 10000, 100000,"0x93de75565d7bf75bc1e93ad4d41f564b330e80f2",'0x1'],
            // [7, 10000, 100000,"0x9102ca3c333c9d129ae943a239c73c716887b425",'0x1'],
            // [7, 10000, 100000,"0x3020f4619796a00ea25c43a2216b54a0ebfc66ec",'0x1'],
            // [7, 10000, 100000,"0x8b5a07b368885b1eb54abc50e7deceeb869b9080",'0x1'],
            // [7, 10000, 100000,"0xd17d4e040212e1eb2c9473d7dcb2f1c2ac5a9517",'0x1'],
            // [7, 10000, 100000,"0xbd7e1091033b3be9cedd2b91723c1df6cc043ec0",'0x1'],
            // [7, 10000, 100000,"0x517c40723638e2f123cb29fe3b5a4d868bccb48c",'0x1'],
            // [7, 10000, 100000,"0xb5419c5037d034ba496b29821b29e066730685fe",'0x1'],
            // [7, 10000, 100000,"0x3e3fe9716631f325696ecc7b7ab3785001d24b2e",'0x1'],
            // [7, 10000, 100000,"0xbf12c73ccc1f7f670bf80d0bba93fe5765df9fec",'0x1'],
            // [7, 10000, 100000,"0x57c73356a4b13364aa4af4f31b9d0562c5803b87",'0x1'],
            // [7, 10000, 100000,"0x59dcc58880be23ba2b4601a54edf264267dffead",'0x1'],
            // [7, 10000, 100000,"0x322613891be9526c526bf49171700ae50ab14d49",'0x1'],
            // [7, 10000, 100000,"0x25ed8af7ec6401f7fe510f535d698acc8f3f2bd9",'0x1'],
            // [7, 10000, 100000,"0x53a55b01a2ce888363dc15d85deb7038f59941e0",'0x1'],
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.lockTime = ts[i][0]
            t.feeRate = ts[i][1]
            t.tranValue = ts[i][2]
            t.validatorAddr = ts[i][3]
            t.status = ts[i][4]
            await stakeInOne(t)
            await sendOne(t)
        }
    })

    it("T101 send money to many.", async ()=>{
        let ts = [
            [7, 10000, 100000,"0x8999b737fe811effae3504443d70dbb56592ae19",'0x1'],
            [7, 10000, 100000,"0xd526456dd64aa4997f06544e1c168fc85a3b1e70",'0x1'],
            [7, 10000, 100000,"0x49ca74a69f2931d75b1099354b603d9c12585c25",'0x1'],
            [7, 10000, 100000,"0x6dc27b2b62b8a04fda99efae4de180adc6a14516",'0x1'],
            [7, 10000, 100000,"0x5c56427a58e5beee53580ec23e4d3a2818c000fd",'0x1'],
            [7, 10000, 100000,"0x1d870ed4983f131ac676b776804afc4f43ed5db4",'0x1'],
            [7, 10000, 100000,"0xac66aa78e4438b684cc1b2f791433b84d5673b4d",'0x1'],
            [7, 10000, 100000,"0xc034cbe41f4b861c2c79f454473c26ee47a6706e",'0x1'],
            [7, 10000, 100000,"0x58f88a4be28db5e9c75230d12b973b5df3393e81",'0x1'],
            [7, 10000, 100000,"0x7e1cf50b04fb52a44acf21488748c88e79d1265c",'0x1'],
            [7, 10000, 100000,"0x4ea4ec595eeeef7d0f9bc63260bd16a7665835f1",'0x1'],
            [7, 10000, 100000,"0x56b7b2b58f97dd0a1bcc4bc9d87bf17f5161a1eb",'0x1'],
            [7, 10000, 100000,"0xbb08a0511bd560cd0d2f793001b468426a23f05c",'0x1'],
            [7, 10000, 100000,"0x150897421e39c3affd4445d1cd2e239c6d381b6c",'0x1'],
            [7, 10000, 100000,"0x49c1b00e1525f82e8bb32356679b4ba9ba90ee68",'0x1'],
            [7, 10000, 100000,"0xd35c507ccfe1ec4b9267a19c6120756909a19c7b",'0x1'],
            [7, 10000, 100000,"0x9ab68f865b4b795293ba642a200561c59d3449ed",'0x1'],
            [7, 10000, 100000,"0xee5fec120f3c12c2737de6021399c0b970c5dcfa",'0x1'],
            [7, 10000, 100000,"0xb35d7639dd1b021dd4b8c90ea956d425f58e8d85",'0x1'],
            [7, 10000, 100000,"0xbd7466e074020f66092905e9f049e29ff9f745ed",'0x1'],
            [7, 10000, 100000,"0x119fea9b497f3397443843b5c990431536eac5c8",'0x1'],
            [7, 10000, 100000,"0xb90a208bc132b33f6e2522be8c862ff519fd5f39",'0x1'],
            [7, 10000, 100000,"0xe185926a93e749d1dd79f174699cbe4b11f68e9e",'0x1'],
            [7, 10000, 100000,"0xd88c9515d176500d76e874fae16b4c86a19b49b8",'0x1'],
            [7, 10000, 100000,"0x396105ef5c633781b3743d4f13f470ed4afcbbc1",'0x1'],
            [7, 10000, 100000,"0xc6733864f7ff32a66c80845f102d92a3bfb88387",'0x1'],
            [7, 10000, 100000,"0x7c7d66dcd3c5e63c3be0dc7cd66ddce8fb9bf047",'0x1'],
            [7, 10000, 100000,"0x4d545048c6a9a2452817684cb65b789fbed1be3e",'0x1'],
            [7, 10000, 100000,"0x4c14319b06b6bddc535f9e5c26bace2d9a5ee9ec",'0x1'],
            [7, 10000, 100000,"0x5179937267a1f4c6a146b0d44bf3ccc477e5029d",'0x1'],
            [7, 10000, 100000,"0x01b59d100a9856fcb6e2f9a51daac3d2637f7827",'0x1'],
            [7, 10000, 100000,"0xba92da568845aaf0242a3c16b54e6c0570014b28",'0x1'],
            [7, 10000, 100000,"0x95619528ba577841fe188d74f2b5d679ce19e634",'0x1'],
            [7, 10000, 100000,"0x089e230e169d5e202fd5d6856834aae207aa9612",'0x1'],
            [7, 10000, 100000,"0xb7a901ef228fcb9d0e71e3f198c7156caee4c020",'0x1'],
            [7, 10000, 100000,"0x9a3da1086e18766a5342f777f79f7b0fea755905",'0x1'],
            [7, 10000, 100000,"0xa2a735f34d3a0e1213676ad32a61fe01fa7099e0",'0x1'],
            [7, 10000, 100000,"0xeac983dfcb2aff3ff45e9a88590594ec7cfe57f9",'0x1'],
            [7, 10000, 100000,"0xb49970775cbcd55b8518683f0081ffba8054577d",'0x1'],
            [7, 10000, 100000,"0xcbc759ce42bffac61e52269bdc9cd6deb2f382a5",'0x1'],
            [7, 10000, 100000,"0x158b89dd869c0c9b1964d9cd2d5317c99368a6b8",'0x1'],
            [7, 10000, 100000,"0x792ed0959febc418c5a458f2c17400f2baa91510",'0x1'],
            [7, 10000, 100000,"0xf7a4bfcc8b2956fe45466fed4d254103feea70b4",'0x1'],
            [7, 10000, 100000,"0x05edc5d755e1a79d56e5e006b6e371a040a335ad",'0x1'],
            [7, 10000, 100000,"0x64cac4d0a4b9b727dc1491f1662b0482d1fb3239",'0x1'],
            [7, 10000, 100000,"0x33688c505e703c08f5a6fa6883b6de4eda2ad747",'0x1'],
            [7, 10000, 100000,"0x1831ec2e62a07e32c7895649f84d824125143e1d",'0x1'],
            [7, 10000, 100000,"0xe867cff6f787d0402cfecbf3b8b6aa860dd30bcd",'0x1'],
            [7, 10000, 100000,"0x0488c16bcb322af990c21e7b44f8614d6adc1593",'0x1'],
            [7, 10000, 100000,"0xbf330993ef35b0ff9b90d5cf460dae05778e8a83",'0x1'],
            [7, 10000, 100000,"0x4877581ccab3382f60db8546d692dbf9af09a91b",'0x1'],
            [7, 10000, 100000,"0xb784933acd316ecad28e6f32751b6f7b3603bce3",'0x1'],
            [7, 10000, 100000,"0xc0727d12d154ce24ea412f59aee3e9cf62470e26",'0x1'],
            [7, 10000, 100000,"0xef2ea77ee26912f6eb422f0b48868c0849886d5c",'0x1'],
            [7, 10000, 100000,"0xbc32b9ae4052d042ea51420d063afc2bbb4bf37c",'0x1'],
            [7, 10000, 100000,"0x39def80abacd22ff10a45ce6f9fd73da40685a3d",'0x1'],
            [7, 10000, 100000,"0xe43ffe5b6c9d6d7f583a97c8472f7d13a9a9aab4",'0x1'],
            [7, 10000, 100000,"0x2ba460e8b47596dd2ee6ffedb43316481d9c7a24",'0x1'],
            [7, 10000, 100000,"0x1d8e16263d919146226601bdab9ef033296026e7",'0x1'],
            [7, 10000, 100000,"0xa7354cf22adc9692d3cea9fe7809da83b20b8b9b",'0x1'],
            [7, 10000, 100000,"0x05bf2e314ff40ee708d87ee4a04491697d4400fc",'0x1'],
            // [7, 10000, 100000,"0xb39662d33283645d96a5f23b07b1b51b01238301",'0x1'],
            // [7, 10000, 100000,"0xb538e97cff90842ae9c4ac57656a2e0659d42526",'0x1'],
            // [7, 10000, 100000,"0xeecad74dd7adce4fcd126533316ddd73e44db7ef",'0x1'],
            // [7, 10000, 100000,"0xae0287516970c6dc9451ad9e27da2b8ff4f06c76",'0x1'],
            // [7, 10000, 100000,"0x213fbc132385e63357aeeea5e8e011c500bc863d",'0x1'],
            // [7, 10000, 100000,"0x93de75565d7bf75bc1e93ad4d41f564b330e80f2",'0x1'],
            // [7, 10000, 100000,"0x9102ca3c333c9d129ae943a239c73c716887b425",'0x1'],
            // [7, 10000, 100000,"0x3020f4619796a00ea25c43a2216b54a0ebfc66ec",'0x1'],
            // [7, 10000, 100000,"0x8b5a07b368885b1eb54abc50e7deceeb869b9080",'0x1'],
            // [7, 10000, 100000,"0xd17d4e040212e1eb2c9473d7dcb2f1c2ac5a9517",'0x1'],
            // [7, 10000, 100000,"0xbd7e1091033b3be9cedd2b91723c1df6cc043ec0",'0x1'],
            // [7, 10000, 100000,"0x517c40723638e2f123cb29fe3b5a4d868bccb48c",'0x1'],
            // [7, 10000, 100000,"0xb5419c5037d034ba496b29821b29e066730685fe",'0x1'],
            // [7, 10000, 100000,"0x3e3fe9716631f325696ecc7b7ab3785001d24b2e",'0x1'],
            // [7, 10000, 100000,"0xbf12c73ccc1f7f670bf80d0bba93fe5765df9fec",'0x1'],
            // [7, 10000, 100000,"0x57c73356a4b13364aa4af4f31b9d0562c5803b87",'0x1'],
            // [7, 10000, 100000,"0x59dcc58880be23ba2b4601a54edf264267dffead",'0x1'],
            // [7, 10000, 100000,"0x322613891be9526c526bf49171700ae50ab14d49",'0x1'],
            // [7, 10000, 100000,"0x25ed8af7ec6401f7fe510f535d698acc8f3f2bd9",'0x1'],
            // [7, 10000, 100000,"0x53a55b01a2ce888363dc15d85deb7038f59941e0",'0x1'],
        ]
        for(let i=0; i<ts.length; i++){
            let t = {}
            t.lockTime = ts[i][0]
            t.feeRate = ts[i][1]
            t.tranValue = ts[i][2]
            t.validatorAddr = ts[i][3]
            t.status = ts[i][4]
            await sendOne(t)
        }
    })

    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

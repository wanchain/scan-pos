'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
const skb = require('./stakebase.js')
let passwd = "wanglu"







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
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "stakein failed")

        let staker = await skb.getStakeInfobyAddr(newAddr);
        console.log(staker)
        assert(staker.LockEpochs == lockTime, "failed stakein in")
        assert(staker.NextLockEpochs == lockTime, "failed stakein in")
        assert(staker.StakeAmount.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed stakein in")
        assert(staker.Amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed stakein in")

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

    it("T3 feeRate=100 when stakein", async ()=>{
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
        let feeRate = 100

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "feeRate=100 when stakein failed")
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
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "feeRate=0 when stakein failed")
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
        let feeRate = 101

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
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "regist first failed")

        txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "register twice should fail")
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
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "value< 10000 stakein failed")
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
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "value<100000&&feeRate!=100 stakein need success, but will not work.")
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
        let feeRate = 100

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "value<100000&&feeRate=100 stakein failed")
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
        let feeRate = 100

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 9999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "value<100000&&feeRate=100 stakein failed")
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
        let feeRate = 100

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "lockTime==7 stakein failed")
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
        let feeRate = 100

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 99999
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "lockTime==90 stakein failed")
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
        let feeRate = 100

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
        let feeRate = 100

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
            let newAddr = await skb.newAccount();
            log.info("newAddr: ", newAddr)
            let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
            let secpub = pubs[0]
            let g1pub = pubs[1]
            let contractDef = web3.eth.contract(skb.cscDefinition);
            let cscContractAddr = "0x00000000000000000000000000000000000000d2";
            let coinContract = contractDef.at(cscContractAddr);
            let payload = coinContract.stakeIn.getData(secpub, g1pub, t.lockTime, t.feeRate)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)
            let status = await skb.checkTxResult(txhash)
            assert(status == t.status, "stakein failed")
            if(t.status == '0x0') return
            log.info(2)
            let staker = await skb.getStakeInfobyAddr(newAddr);
            //console.log(staker)
            assert(staker.LockEpochs == t.lockTime, "failed stakein in")
            assert(staker.NextLockEpochs == t.lockTime, "failed stakein in")
            assert(staker.StakeAmount.cmp(web3.toWei(web3.toBigNumber(t.tranValue).mul(skb.getWeight(t.lockTime))))==0, "failed stakein in")
            assert(staker.Amount.cmp(web3.toWei(web3.toBigNumber(t.tranValue)))==0, "failed stakein in")
            log.info(3)
            console.log("typeof staker.StakingEpoch", typeof(staker.StakingEpoch))

            let epb = await skb.getEpochStakerInfo(Number(staker.StakingEpoch), newAddr)
            console.log(epb)
            log.info(4)

            try {
                let epe = await skb.getEpochStakerInfo(Number(staker.StakingEpoch)+t.lockTime, newAddr)
                console.log(epe)
                assert(false, "last epoch, the probability shuold be empty")
            }catch{
            }
        }
        let ts = [
            [7, 100, 12000,'0x1'],
            [9, 100, 12000,'0x1'],
            [16, 100, 32000,'0x1'],
            [27, 100, 22000,'0x1'],
            [27, 10, 2000,'0x0'],
            [90, 100, 12000,'0x1']
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
    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})

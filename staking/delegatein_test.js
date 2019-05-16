'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');

const skb = require('./stakebase.js')
let passwd = "wanglu"



describe('delegateIn test', async ()=> {
    let newAddr
    before("", async () => {
        await skb.Init()
        newAddr = await skb.newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = skb.coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "stakeIn failed")
    })
    it("T0 value<100 delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 99
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("stakein tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "value<100 delegateIn should fail")

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
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "none-exist delegateIn should fail")

    })
    it("T3 Normal delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 140
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "delegateIn failed")
    })
    it("T4 second delegatein value<100 delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 66
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "second delegatein value<100 delegateIn should success")
    })
    it("T5  delegatein value>5*amount delegateIn", async ()=>{

        let payload = skb.coinContract.delegateIn.getData(newAddr)
        let tranValue = 400000
        let txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "second delegatein value=4*amount delegateIn should success")

        payload = skb.coinContract.delegateIn.getData(newAddr)
        tranValue = 100000
        txhash = await skb.sendStakeTransaction(tranValue, payload)

        log.info("delegateIn tx:", txhash)
        status = await skb.checkTxResult(txhash)
        assert(status == '0x0', "second delegatein value>5*amount delegateIn should fail")

    })
    it("TCP Normal delegateIn, check probability", async ()=>{
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
        let feeRate = 90
        let lockTime = 90
        let validatorStakeAmount = web3.toBigNumber(web3.toWei(50000)).mul(skb.getWeight(lockTime))
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let txhash = await skb.sendStakeTransaction(tranValue, payload)
        let status = await skb.checkTxResult(txhash)
        assert(status == '0x1', "stakein failed")
        let totalAmount = web3.toBigNumber(0)
        let totalStakeAmount = web3.toBigNumber(0)
        async function delegateInOne(t) {
            let payload = skb.coinContract.delegateIn.getData(newAddr)
            let txhash = await skb.sendStakeTransaction(t.tranValue, payload)

            log.info("delegateIn tx:", txhash)
            let status = await skb.checkTxResult(txhash)
            assert(status == t.status, "delegateIn failed")
            if(t.status == '0x0') return

            let staker = await skb.getStakeInfobyAddr(newAddr);
            //console.log(staker)
            assert(staker.LockEpochs == lockTime, "failed stakein in")
            assert(staker.NextLockEpochs == lockTime, "failed stakein in")
            assert(staker.StakeAmount.cmp(web3.toWei(web3.toBigNumber(tranValue).mul(skb.getWeight(lockTime))))==0, "failed stakein in")
            assert(staker.Amount.cmp(web3.toWei(web3.toBigNumber(tranValue)))==0, "failed stakein in")

            assert(staker.Clients.length == 1, "delegatein failed")
            assert(staker.Clients[0].Address == skb.coinbase(), "delegate failed")

            let amount =web3.toWei(web3.toBigNumber(t.tranValue))
            totalAmount = totalAmount.add(amount)
            console.log(staker.Clients[0].Amount.toString(10))
            console.log(totalAmount.toString(10))
            assert(staker.Clients[0].Amount.cmp(totalAmount)==0, "delegate failed")
            let stakeAmount =web3.toWei(web3.toBigNumber(t.tranValue)).mul(skb.getWeight(skb.minEpoch))
            totalStakeAmount = totalStakeAmount.add(stakeAmount)
            assert(staker.Clients[0].StakeAmount.cmp(totalStakeAmount)==0, "delegate failed")

            let epb = await skb.getEpochStakerInfo(Number(staker.StakingEpoch), newAddr)
            console.log(epb)
            assert(epb.Infors.length == 2,"delegate failed")
            console.log(totalStakeAmount.toString(10))
            console.log(web3.toBigNumber(epb.Infors[1].Probability).toString(10))

            assert(web3.toBigNumber(epb.Infors[1].Probability).cmp(totalStakeAmount) == 0,"delegate failed")
            let allStakeAmount = validatorStakeAmount.add(totalStakeAmount)
            assert(web3.toBigNumber(epb.TotalProbability).cmp(allStakeAmount)==0,"delegate failed")
            try {
                let epe = await skb.getEpochStakerInfo(Number(staker.StakingEpoch)+lockTime, newAddr)
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
            [20,'0x1'],
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

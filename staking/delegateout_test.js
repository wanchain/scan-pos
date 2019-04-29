'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
const cscDefinition = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            },
            {
                "name": "lockEpochs",
                "type": "uint256"
            },
            {
                "name": "feeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeUpdate",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            }
        ],
        "name": "stakeAppend",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "secPk",
                "type": "bytes"
            },
            {
                "name": "bn256Pk",
                "type": "bytes"
            },
            {
                "name": "lockEpochs",
                "type": "uint256"
            },
            {
                "name": "feeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeIn",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "delegateAddress",
                "type": "address"
            }
        ],
        "name": "delegateIn",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "delegateAddress",
                "type": "address"
            }
        ],
        "name": "delegateOut",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
]
let contractDef = web3.eth.contract(cscDefinition);
let cscContractAddr = "0x00000000000000000000000000000000000000d2";
let coinContract = contractDef.at(cscContractAddr);

let coinbase;
let passwd = "wanglu"

async function waitReceipt(txhash) {
    let lastBlock = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
    let newBlock = lastBlock
    while(newBlock - lastBlock < 4) {
        await pu.sleep(1000)
        newBlock = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
        if( newBlock != lastBlock) {
            let rec = await pu.promisefy(web3.eth.getTransactionReceipt, [txhash], web3.eth)
            if ( rec ) {
                return rec
            }
        }
    }
    return null
}
async function newAccount() {
    let addr = await pu.promisefy(web3.personal.newAccount, [passwd], web3.personal)
    log.info("newAccount: ", addr)

    // for pos trsaction gas fee
    let ret = await pu.promisefy(web3.eth.sendTransaction, [{from: coinbase, to: addr, value: web3.toWei(1)}], web3.eth)
    log.info("send gasfee:", ret)
    return addr
}

async function checkTxResult(txhash) {
    let rec = await waitReceipt(txhash)
    //log.info("tx ",txhash, "receipt: ", rec)
    assert(rec != null, "Can't get receipt of "+txhash)
    return rec.status
}
// normal delegate in.
async function delegatein() {
    // add delegator
    let payloadDelegate = coinContract.delegateIn.getData(secAddr)
    let tx2 = eth.sendTransaction({
        from: eth.coinbase,
        to: cscContractAddr,
        value: web3.toWin(tranValue),
        data: payloadDelegate,
        gas: 200000,
        gasprice: '0x' + (20000000000).toString(16)
    });
    console.log("tx2= " + tx2)
}


function main111() {








// append delegate


// append validator
    let tranValue4 = 11111
    let payload4 = coinContract.stakeAppend.getData(secAddr)
    console.log("payload: ", payload)
    let tx = eth.sendTransaction({
        from: eth.coinbase,
        to: cscContractAddr,
        value: web3.toWin(tranValue4),
        data: payload4,
        gas: 200000,
        gasprice: '0x' + (20000000000).toString(16)
    });
    console.log("tx4=" + tx)


// delegateOut
    let payloadDelegate5 = coinContract.delegateOut.getData(secAddr)
    let tx5 = eth.sendTransaction({
        from: eth.coinbase,
        to: cscContractAddr,
        value: '0x00',
        data: payloadDelegate5,
        gas: 200000,
        gasprice: '0x' + (20000000000).toString(16)
    });
    console.log("tx5= " + tx5)

}

describe('delegateOut test', async ()=> {
    let newAddr
    before("", async () => {
        coinbase = await pu.promisefy(web3.eth.getCoinbase, [], web3.eth)
        log.info("coinbase: ", coinbase)
        newAddr = await newAccount();
        log.info("newAddr: ", newAddr)
        let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
        let secpub = pubs[0]
        let g1pub = pubs[1]
        /////////////////////////////////register staker////////////////////////////////////////////////////////////////////////

        let contractDef = web3.eth.contract(cscDefinition);
        let cscContractAddr = "0x00000000000000000000000000000000000000d2";
        let coinContract = contractDef.at(cscContractAddr);

        let lockTime = 7
        let feeRate = 79

        // add validator
        let payload = coinContract.stakeIn.getData(secpub, g1pub, lockTime, feeRate)
        let tranValue = 100000
        let txhash = await pu.promisefy(web3.eth.sendTransaction, [{
            from: coinbase,
            to: cscContractAddr,
            value: web3.toWei(tranValue),
            data: payload,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        log.info("stakein tx:", txhash)
        let status = await checkTxResult(txhash)
        assert(status == '0x1', "stakeIn failed")
    })
    it("T0  invalidaddr delegateOut", async ()=>{

        // delegateOut
        let payloadDelegate = coinContract.delegateOut.getData("0x9988")
        let txhash = await pu.promisefy(web3.eth.sendTransaction,[{
            from: coinbase,
            to: cscContractAddr,
            value: '0x00',
            data: payloadDelegate,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        let status = await checkTxResult(txhash)
        assert(status == '0x0', "invalidaddr delegateOut should fail")
    })
    it("T1  non-exist delegateOut", async ()=>{

        // delegateOut
        let payloadDelegate = coinContract.delegateOut.getData("0x80000000000000000000000000000000000000d2")
        let txhash = await pu.promisefy(web3.eth.sendTransaction,[{
            from: coinbase,
            to: cscContractAddr,
            value: '0x00',
            data: payloadDelegate,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        let status = await checkTxResult(txhash)
        assert(status == '0x0', "non-exist  delegateOut should fail")
    })

    it("T3 msgfrom non-exist delegateOut", async ()=>{

        // delegateOut
        let payloadDelegate = coinContract.delegateOut.getData(newAddr)
        let txhash = await pu.promisefy(web3.eth.sendTransaction,[{
            from: coinbase,
            to: cscContractAddr,
            value: '0x00',
            data: payloadDelegate,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        let status = await checkTxResult(txhash)
        assert(status == '0x0', "msgfrom non-exist delegateOut should fail")
    })

    it("T3 normal delegateOut", async ()=>{

        let payloadDelegate = coinContract.delegateIn.getData(newAddr)
        let tranValue = 140
        let txhash = await pu.promisefy(web3.eth.sendTransaction,[{
            from: coinbase,
            to: cscContractAddr,
            value: web3.toWei(tranValue),
            data: payloadDelegate,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        log.info("delegateIn tx:", txhash)
        let status = await checkTxResult(txhash)
        assert(status == '0x1', "delegateIn failed")


        // delegateOut
        payloadDelegate = coinContract.delegateOut.getData(newAddr)
        txhash = await pu.promisefy(web3.eth.sendTransaction,[{
            from: coinbase,
            to: cscContractAddr,
            value: '0x00',
            data: payloadDelegate,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        status = await checkTxResult(txhash)
        assert(status == '0x1', "normal delegateOut should success")
    })
    it("T3 second delegateOut", async ()=>{
        // delegateOut
        let payloadDelegate = coinContract.delegateOut.getData(newAddr)
        let txhash = await pu.promisefy(web3.eth.sendTransaction,[{
            from: coinbase,
            to: cscContractAddr,
            value: '0x00',
            data: payloadDelegate,
            gas: 200000,
            gasprice: '0x' + (20000000000).toString(16)
        }], web3.eth);
        console.log("tx5= " + txhash)

        log.info("delegateOut tx:", txhash)
        let status = await checkTxResult(txhash)
        assert(status == '0x0', "second delegateOut should fail")
    })


    after(async ()=>{
        log.info("====end====")
        //process.exit(0)
    })
})
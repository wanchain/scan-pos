
let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const assert = require('assert');
let coinbase="0x28CA21654E3E082A0D282DAF2010352c157008E0";

let passwd = "wanglu"


//------------------RUN CODE DO NOT MODIFY------------------
var wlcDefinition =
[
	{
		"constant": false,
		"inputs": [
			{
				"name": "EpochId",
				"type": "uint256"
			},
			{
				"name": "wlIndex",
				"type": "uint256"
			},
			{
				"name": "wlCount",
				"type": "uint256"
			}
		],
		"name": "upgradeWhiteEpochLeader",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

var contractDef = web3.eth.contract(wlcDefinition);
var wlContractAddr = "0x0000000000000000000000000000000000000264";
var wlContract = contractDef.at(wlContractAddr);

var payload = wlContract.upgradeWhiteEpochLeader.getData(2608636, 0,26)
var tx = web3.personal.sendTransaction({from:coinbase, to:wlContractAddr, value:'0x00', data:payload, gas: 200000, gasprice:'0x' + (200000000000).toString(16)},"wanglu");
console.log("tx=" + tx)
//------------------RUN CODE DO NOT MODIFY------------------

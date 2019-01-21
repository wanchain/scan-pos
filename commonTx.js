'use strict'

const CoinNodeObj = require('conf/coinNodeObj.js')
let log = console

let web3Instance = new CoinNodeObj(log, 'wan');
const from = "0x23Fc2eDa99667fD3df3CAa7cE7e798d94Eec06eb"
const to = "0x435b316A70CdB8143d56B3967Aacdb6392FD6125"
main();

async function main() {
  for(let i=0; i<1000; i++) {
    web3.eth.sendTransaction({from:"", to:"", value: 100});
  }
  console.log("done.")
}
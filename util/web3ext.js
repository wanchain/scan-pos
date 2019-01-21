module.exports = {
  extend: (web3) => {
    function insertMethod(name, call, params, inputFormatter, outputFormatter) {
      return new web3._extend.Method({ name, call, params, inputFormatter, outputFormatter });
    }

    function insertProperty(name, getter, outputFormatter) {
      return new web3._extend.Property({ name, getter, outputFormatter });
    }

    // eth
    web3._extend({
      property: 'eth',
      methods:
        [
          insertMethod('getRawTransaction', 'eth_getRawTransactionByHash', 1, [null], null)
        ],
      properties:
        [],
    });
  },
};

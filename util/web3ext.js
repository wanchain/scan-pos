module.exports = {
  extend: (web3) => {
    function insertMethod(name, call, params, inputFormatter, outputFormatter) {
      return new web3._extend.Method({ name, call, params, inputFormatter, outputFormatter });
    }

    function insertProperty(name, getter, outputFormatter) {
      return new web3._extend.Property({ name, getter, outputFormatter });
    }

    web3._extend({
      property: 'eth',
      methods:
        [
          insertMethod('getRawTransaction', 'eth_getRawTransactionByHash', 1, [null], null)
        ],
      properties:
        [],
    });

    web3._extend({
      property: 'personal',
      methods:
          [
            insertMethod('showPublicKey', 'personal_showPublicKey', 2, [null,null], null)
          ],
      properties:
          [],
    });

    web3._extend({
      property: 'txpool',
      methods: [
        insertMethod('status', 'txpool_status', 0, null, null)
      ],
      properties:
          [
          ]
    });
  },
};

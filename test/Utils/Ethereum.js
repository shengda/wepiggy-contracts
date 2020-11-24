const {accounts, contract, web3} = require('@openzeppelin/test-environment');
const BigNum = require('bignumber.js');
const {
  BN,          // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time,
  times,
} = require('@openzeppelin/test-helpers');

const {expect} = require('chai');
const ethers = require('ethers');


function address(n) {
  return `0x${n.toString(16).padStart(40, '0')}`;
}

function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder();
  return abi.encode(types, values);
}

async function etherBalance(addr) {
  return ethers.BigNumber.from(new BigNum(await web3.eth.getBalance(addr)).toFixed());
}

async function etherGasCost(receipt) {
    const tx = await web3.eth.getTransaction(receipt.transactionHash);
  const gasUsed = new BigNum(receipt.gasUsed);
  const gasPrice = new BigNum(tx.gasPrice);
  return ethers.BigNumber.from(gasUsed.times(gasPrice).toFixed());
}

function etherExp(num) { return etherMantissa(num, 1e18) }
function etherDouble(num) { return etherMantissa(num, 1e36) }
function etherMantissa(num, scale = 1e18) {
  if (num < 0)
    return ethers.BigNumber.from(new BigNum(2).pow(256).plus(num).toFixed());
  return ethers.BigNumber.from(new BigNum(num).times(scale).toFixed());
}

function etherUnsigned(num) {
  return ethers.BigNumber.from(new BigNum(num).toFixed());
}

function mergeInterface(into, from) {
  const key = (item) => item.inputs ? `${item.name}/${item.inputs.length}` : item.name;
  const existing = into.abi.reduce((acc, item) => {
    acc[key(item)] = true;
    return acc;
  }, {});
  const extended = from.abi.reduce((acc, item) => {
    if (!(key(item) in existing))
      acc.push(item)
    return acc;
  }, into.abi.slice());
  into.abi = into.abi.concat(from.abi);
  return into;
}

function getContractDefaults() {
  return { gas: 20000000, gasPrice: 20000 };
}

function keccak256(values) {
  return ethers.utils.keccak256(values);
}

function unlockedAccounts() {
  let provider = web3.currentProvider;
  if (provider._providers)
    provider = provider._providers.find(p => p._ganacheProvider)._ganacheProvider;
  return provider.manager.state.unlocked_accounts;
}

function unlockedAccount(a) {
  return unlockedAccounts()[a.toLowerCase()];
}

async function mineBlockNumber(blockNumber) {
  return rpc({method: 'evm_mineBlockNumber', params: [blockNumber]});
}

async function mineBlock() {
  return rpc({ method: 'evm_mine' });
}

async function increaseTime(seconds) {
  await rpc({ method: 'evm_increaseTime', params: [seconds] });
  return rpc({ method: 'evm_mine' });
}

async function setTime(seconds) {
  await rpc({ method: 'evm_setTime', params: [new Date(seconds * 1000)] });
}

async function freezeTime(seconds) {
  await rpc({ method: 'evm_freezeTime', params: [seconds] });
  return rpc({ method: 'evm_mine' });
}

async function advanceBlocks(blocks) {
  let { result: num } = await rpc({ method: 'eth_blockNumber' });
  await rpc({ method: 'evm_mineBlockNumber', params: [blocks + parseInt(num)] });
}

async function blockNumber() {
  let { result: num } = await rpc({ method: 'eth_blockNumber' });
  return parseInt(num);
}

async function minerStart() {
  return rpc({ method: 'miner_start' });
}

async function minerStop() {
  return rpc({ method: 'miner_stop' });
}

async function rpc(request) {
  return new Promise((okay, fail) => web3.currentProvider.send(request, (err, res) => err ? fail(err) : okay(res)));
}

async function both(contract, method, args = [], opts = {}) {
  const reply = await call(contract, method, args, opts);
  const receipt = await send(contract, method, args, opts);
  return { reply, receipt };
}

async function sendFallback(contract, opts = {}) {
  const receipt = await web3.eth.sendTransaction({ to: contract._address, ...Object.assign(getContractDefaults(), opts) });
  return Object.assign(receipt, { events: receipt.logs });
}


module.exports = {
  address,
  encodeParameters,
  etherBalance,
  etherGasCost,
  etherExp,
  etherDouble,
  etherMantissa,
  etherUnsigned,
  mergeInterface,
  keccak256,
  unlockedAccounts,
  unlockedAccount,

  advanceBlocks,
  blockNumber,
  freezeTime,
  increaseTime,
  mineBlock,
  mineBlockNumber,
  minerStart,
  minerStop,
  rpc,
  setTime,

  both,
  sendFallback
};


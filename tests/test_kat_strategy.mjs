import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('assets/js/kat-strategy.js','utf8');
const math=source.slice(source.indexOf('export function subscriberPosition'),source.indexOf('export function updateChannelProgress'));
const {subscriberPosition}=await import('data:text/javascript;base64,'+Buffer.from(math).toString('base64'));
assert.equal(subscriberPosition(0),0);assert(Math.abs(subscriberPosition(1000)-100/3)<1e-9);assert(Math.abs(subscriberPosition(5000)-200/3)<1e-9);assert.equal(subscriberPosition(10000),100);assert.equal(subscriberPosition(3000),50);assert(Math.abs(subscriberPosition(7500)-250/3)<1e-9);assert.equal(subscriberPosition(20000),100);assert.equal(subscriberPosition(null),null);assert.equal(subscriberPosition(-1),null);
console.log('PASS: equal milestone positions, interpolation, bounds, and unknown subscriber data.');

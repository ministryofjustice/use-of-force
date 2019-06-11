require('dotenv').config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const chaiString = require('chai-string');


// Test Assertion libraries
chai.use(chaiAsPromised);
chai.use(chaiString);

global.expect = chai.expect;
global.sinon = sinon;

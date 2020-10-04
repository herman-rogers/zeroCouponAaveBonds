const aaveWrapper = artifacts.require('aaveWrapper');
const capitalHandler = artifacts.require('capitalHandler');
const dummyAToken = artifacts.require('dummyAToken');

module.exports = async function(deployer) {
	dummyTokenInstance = await deployer.deploy(dummyAToken);
	dummyTokenInstance = await deployer.deploy(dummyAToken);
	aaveWrapperInstance = await deployer.deploy(aaveWrapper, dummyTokenInstance.address);
	timeNow = parseInt((new Date()).getTime()/1000);
	capitalHandlerInstance = await deployer.deploy(capitalHandler, aaveWrapperInstance.address, timeNow+86400);
};
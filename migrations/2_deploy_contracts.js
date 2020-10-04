const aaveWrapper = artifacts.require('aaveWrapper');
const capitalHandler = artifacts.require('capitalHandler');
const dummyAToken = artifacts.require('dummyAToken');
const organizer = artifacts.require('organizer');

module.exports = async function(deployer) {
	timeNow = parseInt((new Date()).getTime()/1000);
	secondsPerMonth = 30*24*60*60;
	dummyTokenInstance = await deployer.deploy(dummyAToken);
	dummyTokenInstance = await deployer.deploy(dummyAToken);
	organizerInstance = await deployer.deploy(organizer);
	await organizerInstance.deployATokenWrapper(dummyTokenInstance.address);
	await organizerInstance.deployCapitalHandlerInstance(dummyTokenInstance.address, timeNow+secondsPerMonth);
};

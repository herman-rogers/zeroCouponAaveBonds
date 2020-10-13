const aaveWrapper = artifacts.require('aaveWrapper');
const capitalHandler = artifacts.require('capitalHandler');
const dummyAToken = artifacts.require('dummyAToken');
const organizer = artifacts.require('organizer');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');

const UniswapV2FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

const kovanAEthAddress = "0xD483B49F2d55D2c53D32bE6efF735cB001880F79";


const start2021 = "1609459200";
const start2022 = "1640995200";
const start2026 = "1767225600";

module.exports = async function(deployer) {
	factory = await UniswapV2Factory.at(UniswapV2FactoryAddress);

	organizerInstance = await deployer.deploy(organizer);

	await organizerInstance.deployATokenWrapper(kovanAEthAddress);
	await organizerInstance.deployCapitalHandlerInstance(kovanAEthAddress, start2021);
	await organizerInstance.deployCapitalHandlerInstance(kovanAEthAddress, start2022);
	await organizerInstance.deployCapitalHandlerInstance(kovanAEthAddress, start2026);

	capitalHandlers = await organizerInstance.allCapitalHandlerInstances();

	for (let i = 0; i < capitalHandlers.length; i++) {
		await factory.createPair(kovanAEthAddress, capitalHandlers[i]);
	}
};

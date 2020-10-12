const dummyAToken = artifacts.require('dummyAToken');
const aaveWrapper = artifacts.require('aaveWrapper');
const capitalHandler = artifacts.require('capitalHandler');

const helper = require("../helper/helper.js");

const BN = web3.utils.BN;
const _10To18 = (new BN('10')).pow(new BN('18'));


contract('capitalHandler', async function(accounts){
	it('before each', async () => {
		dummyATokenInstance = await dummyAToken.new();
		aaveWrapperInstance = await aaveWrapper.new(dummyATokenInstance.address);
		timeNow = (await web3.eth.getBlock('latest')).timestamp;
		capitalHandlerInstance = await capitalHandler.new(aaveWrapperInstance.address, timeNow+86400);
		inflation = await dummyATokenInstance.inflation();
		//wrap aTokens
		amount = '100000';
		await dummyATokenInstance.approve(aaveWrapperInstance.address, amount);
		await aaveWrapperInstance.firstDeposit(accounts[0], amount);
	});

	it('deposits funds', async () => {
		await aaveWrapperInstance.approve(capitalHandlerInstance.address, amount);
		await capitalHandlerInstance.depositWrappedToken(accounts[0], amount);
		assert.equal((await capitalHandlerInstance.balanceYield(accounts[0])).toString(), amount, "correct balance yield for account 1");
	});

	it('has correct bond sending limits', async () => {
		amountPlusOne = '100001';
		caught = false;
		await capitalHandlerInstance.transfer(accounts[1], amountPlusOne).catch(() => {
			caught = true;
		}).then(() => {
			assert.equal(caught, true, "cannot send more bonds than one has collateral for");
		});
		await capitalHandlerInstance.transfer(accounts[1], amount);
		assert.equal((await capitalHandlerInstance.balanceBonds(accounts[0])).toString(), '-'+amount, "correct bond balance for account 0");
		assert.equal((await capitalHandlerInstance.balanceBonds(accounts[1])).toString(), amount, "correct bond balance for account 1");
		assert.equal((await capitalHandlerInstance.balanceOf(accounts[0])).toString(), '0', "correct val returned by minimumATokensAtMaturity()");
		assert.equal((await capitalHandlerInstance.balanceOf(accounts[1])).toString(), amount, "correct val returned by minimumATokensAtMaturity()");
		assert.equal((await capitalHandlerInstance.wrappedTokenFree(accounts[0])).toString(), '0', 'correct val returned by wrappedTokenFree()');
		assert.equal((await capitalHandlerInstance.wrappedTokenFree(accounts[1])).toString(), '0', 'correct val returned by wrappedTokenFree()');
	});

	it('gives yield to yield holder', async () => {
		//increase value of wrapped token by 2x
		inflation = inflation.mul(new BN(2));
		await dummyATokenInstance.setInflation(inflation.toString());
		assert.equal((await capitalHandlerInstance.balanceBonds(accounts[0])).toString(), '-'+amount, "correct bond balance for account 0");
		assert.equal((await capitalHandlerInstance.balanceOf(accounts[0])).toString(), amount, "correct val returned by minimumATokensAtMaturity()");
		assert.equal((await capitalHandlerInstance.wrappedTokenFree(accounts[0])).toString(), (parseInt(amount)/2)+"", 'correct val returned by wrappedTokenFree()');
	});

	it('withdraws funds unwrap:false', async () => {
		toWithdraw = (parseInt(amount)/8)+"";
		prevBalanceYield = await capitalHandlerInstance.balanceYield(accounts[0]);
		await capitalHandlerInstance.withdraw(accounts[1], toWithdraw, false);
		assert.equal((await aaveWrapperInstance.balanceOf(accounts[1])).toString(), toWithdraw, "corect balance wrapped token for account 1");
		assert.equal((await capitalHandlerInstance.balanceYield(accounts[0])).toString(), prevBalanceYield.sub(new BN(toWithdraw)).toString(), "correct balance yield for account 0");
	});

	it('withdraws funds unwrap:true', async () => {
		toWithdraw = (parseInt(amount)/8)+"";
		prevBalanceYield = await capitalHandlerInstance.balanceYield(accounts[0]);
		await capitalHandlerInstance.withdraw(accounts[1], toWithdraw, true);
		expectedAToken = inflation.mul(new BN(toWithdraw)).div(_10To18);
		assert.equal((await dummyATokenInstance.balanceOf(accounts[1])).toString(), expectedAToken, "corect balance wrapped token for account 1");
		assert.equal((await capitalHandlerInstance.balanceYield(accounts[0])).toString(), prevBalanceYield.sub(new BN(toWithdraw)).toString(), "correct balance yield for account 0");		
	});

	it('enters payout phase', async () => {
		assert.equal(await capitalHandlerInstance.inPayoutPhase(), false, "payout phase has not been entered yet");
		caught = false;
		await capitalHandlerInstance.enterPayoutPhase().catch(() => {
			caught = true;
		}).then(() => {
			assert.equal(caught, true, "cannot enter payout phase before maturity");
		});
		await helper.advanceTime(86400);
		await capitalHandlerInstance.enterPayoutPhase();
		assert.equal(await capitalHandlerInstance.inPayoutPhase(), true, "payout phase has been entered");
		caught = false;
		await capitalHandlerInstance.enterPayoutPhase().catch(() => {
			caught = true;
		}).then(() => {
			assert.equal(caught, true, "cannot enter payout phase after it has already been entered");
		});
		maturityConversionRate = await capitalHandlerInstance.maturityConversionRate();
	});

	it('does not reward bond sellers with yield after payout', async () => {
		minATknAtMaturity = await capitalHandlerInstance.balanceOf(accounts[0]);
		postMaturityInflation = inflation.mul(new BN(2));
		await dummyATokenInstance.setInflation(postMaturityInflation.toString());
		assert.equal((await capitalHandlerInstance.balanceOf(accounts[0])).toString(), minATknAtMaturity,
			"yield holders not rewarded by yield generated on lent out funds after maturity");
	});

	it('bond holders capture yield generated after maturity', async () => {
		bondBalAct1 = await capitalHandlerInstance.balanceBonds(accounts[1]);
		expectedPayout = bondBalAct1.mul(postMaturityInflation).div(inflation);
		await capitalHandlerInstance.claimBondPayout(accounts[2], {from: accounts[1]});
		assert.equal((await capitalHandlerInstance.balanceBonds(accounts[1])).toString(), '0', "balance long bond decrease to 0");
		assert.equal((await dummyATokenInstance.balanceOf(accounts[2])).toString(), expectedPayout.toString(), "correct payout of long bond tokens");
	});

});

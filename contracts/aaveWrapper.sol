pragma solidity >=0.6.5 <0.7.0;
import "./interfaces/IERC20.sol";
import "./ERC20.sol";
import "./libraries/SafeMath.sol";

contract aaveWrapper is ERC20 {
	using SafeMath for uint;

	address public aToken;

	constructor (address _aToken) public {
		aToken = _aToken;
		decimals = IERC20(_aToken).decimals();
		name = string(abi.encodePacked('wrapped ',IERC20(_aToken).name()));
		symbol = string(abi.encodePacked('w', IERC20(_aToken).symbol()));
	}

	function firstDeposit(address _to, uint _amountAToken) public returns (uint _amountWrappedToken) {
		require(totalSupply == 0);
		IERC20 _aToken = IERC20(aToken);
		_aToken.transferFrom(msg.sender, address(this), _amountAToken);
		balanceOf[_to] = _amountAToken;
		totalSupply = _amountAToken;
		_amountWrappedToken = _amountAToken;
	}

	function deposit(address _to, uint _amountAToken) public returns (uint _amountWrappedToken) {
		IERC20 _aToken = IERC20(aToken);
		uint contractBalance = _aToken.balanceOf(address(this));
		_aToken.transferFrom(msg.sender, address(this), _amountAToken);
		_amountWrappedToken = totalSupply*_amountAToken/contractBalance;
		balanceOf[_to] += _amountWrappedToken;
		totalSupply += _amountWrappedToken;
	}

	function withdrawAToken(address _to, uint _amountAToken) public returns (uint _amountWrappedToken) {
		IERC20 _aToken = IERC20(aToken);
		uint contractBalance = _aToken.balanceOf(address(this));
		//_amountWrappedToken == ceil(totalSupply*_amountAToken/contractBalance)
		_amountWrappedToken = totalSupply*_amountAToken;
		_amountWrappedToken = (_amountWrappedToken%contractBalance == 0 ? 0 : 1) + (_amountWrappedToken/contractBalance);
		require(balanceOf[msg.sender] >= _amountWrappedToken);
		balanceOf[msg.sender] -= _amountWrappedToken;
		totalSupply -= _amountWrappedToken;
		_aToken.transfer(_to, _amountAToken);
	}

	function withdrawWrappedToken(address _to, uint _amountWrappedToken) public returns (uint _amountAToken) {
		require(balanceOf[msg.sender] >= _amountWrappedToken);
		IERC20 _aToken = IERC20(aToken);
		uint contractBalance = _aToken.balanceOf(address(this));
		_amountAToken = contractBalance*_amountWrappedToken/totalSupply;
		balanceOf[msg.sender] -= _amountWrappedToken;
		totalSupply -= _amountWrappedToken;
		_aToken.transfer(_to, _amountAToken);
	}

	function ATokenToWrappedToken(uint _amountAToken) public view returns (uint _amountWrappedToken) {
		IERC20 _aToken = IERC20(aToken);
		uint contractBalance = _aToken.balanceOf(address(this));
		/*
			_amountWrappedToken == ceil(contractBalance*_amountAToken/totalSupply)
		*/
		_amountWrappedToken = totalSupply*_amountAToken;
		_amountWrappedToken = (_amountWrappedToken%contractBalance == 0 ? 0 : 1) + _amountWrappedToken/contractBalance;
	}

	function WrappedTokenToAToken(uint _amountWrappedToken) public view returns (uint _amountAToken) {
		IERC20 _aToken = IERC20(aToken);
		uint contractBalance = _aToken.balanceOf(address(this));
		_amountAToken = contractBalance*_amountWrappedToken/totalSupply;
	}
}
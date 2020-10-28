pragma solidity >=0.6.5 <0.7.0;
import "./interfaces/IERC20.sol";
import "./libraries/SafeMath.sol";
import "./yieldToken.sol";

contract yieldTokenDeployer {
	address public addr;

	function deploy(address _aToken) public {
		addr = address(new yieldToken(_aToken, msg.sender));
	}
}
////SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract SwapSingle {
    address owner;
    IUniswapV2Pair pair;

    event log(string message);
    event logValue(string message, uint256 val);
    event logAddress(string message, address val);

    constructor(address _owner) {
        owner = _owner;
    }

    function checkOwner() public view returns (address) {
        return owner;
    }
    function swapSingle(
        address target,
        address routerAID,
        address routerBID,
        uint256 tradeSize,
        uint256 amountOutA,
        uint256 amountOutB,
        address[] memory path0,
        address[] memory path1,
        address to,
        uint256 deadline
    ) external {
        console.log("SwapSingle: swapSingle contract entered");
        IERC20 tokenIn = IERC20(path0[0]);
        IUniswapV2Router02 routerA = IUniswapV2Router02(routerAID);
        IUniswapV2Router02 routerB = IUniswapV2Router02(routerBID);

        approveTokensIn(tokenIn, routerAID);
        // Check that the 'from' address has enough tokens
        uint256 balance = tokenIn.balanceOf(msg.sender);
        require(balance >= tradeSize, "SwapSingle: INSUFFICIENT_INPUT_AMOUNT");

        // Check that the 'from' address has approved the contract to transfer tokens
        uint256 allowance = tokenIn.allowance(msg.sender, address(this));
        require(allowance >= tradeSize, "SwapSingle: CONTRACT_NOT_APPROVED");

        performSwap(
            routerA,
            routerB,
            tradeSize,
            amountOutA,
            amountOutB,
            path0,
            path1,
            to,
            deadline
        );
        tokenIn.transfer(msg.sender, tokenIn.balanceOf(address(this)));
    }

    function approveTokensIn(IERC20 tokenIn, address routerAID) internal {
        tokenIn.approve(routerAID, type(uint256).max);
        console.log("tokenIn: ", address(tokenIn));
        console.log("SwapSingle: tokens approved");
    }

    // function safeTransferFrom(address token, address from, address to, uint value) internal {
    //     // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
    //     (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
    //     require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    // }
    // function approveContract(IERC20 token, uint256 amount) external {
    //     token.approve(address(this), type(uint256).max);
    // }
    function performSwap(
        IUniswapV2Router02 routerA,
        IUniswapV2Router02 routerB,
        uint256 tradeSize,
        uint256 amountOut,
        uint256 amountOutB,
        address[] memory path0,
        address[] memory path1,
        address to,
        uint256 deadline
    ) internal {
        IERC20 tokenIn = IERC20(path0[0]);
        console.log(path0[0]);
        console.log(path0[1]);
        uint256[] memory amountsOutA = routerA.getAmountsOut(tradeSize, path0);
        require(
            amountsOutA[1] >= amountOut,
            "Error SwapSingle: routerA.getAmountsOut < amountOutA"
        );

        uint256 allowanceRouter = tokenIn.allowance(msg.sender, address(routerA));
        require(allowanceRouter >= tradeSize, "SwapSingle: ROUTER_NOT_APPROVED");

        uint256[] memory swapIn = routerA.swapExactTokensForTokens(
            tradeSize,
            0,
            path0,
            address(this),
            deadline
        );

        uint256[] memory amountsOutB = routerB.getAmountsOut(swapIn[1], path1);
        require(amountsOutB[1] >= tradeSize, "Error SwapSingle: Insufficient output: Target");

        routerB.swapTokensForExactTokens(swapIn[1], tradeSize, path1, to, deadline);
    }
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);

    function token1() external view returns (address);
}

interface IUniswapV2Library {
    function getReserves(
        address factory,
        address tokenA,
        address tokenB
    ) external view returns (uint112 reserveA, uint112 reserveB, uint32 blockTimestampLast);

    function getAmountsOut(
        uint amountIn,
        address[] memory path
    ) external view returns (uint[] memory amounts);

    function getAmountsIn(
        address factory,
        uint amountOut,
        address[] memory path
    ) external view returns (uint[] memory amounts);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
}

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(
        uint amountIn,
        address[] memory path
    ) external view returns (uint[] memory amounts);

    function getAmountsIn(
        uint amountOut,
        address[] memory path
    ) external view returns (uint[] memory amounts);
}

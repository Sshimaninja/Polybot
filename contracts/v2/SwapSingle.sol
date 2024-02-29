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
        console.log("SwapSingle: contract entered");
        // Perform the first swap
        IERC20 tokenIn = IERC20(path0[0]);
        IERC20 tokenOut = IERC20(path0[path0.length - 1]);
        IUniswapV2Router02 routerA = IUniswapV2Router02(routerAID);
        IUniswapV2Router02 routerB = IUniswapV2Router02(routerBID);
        tokenIn.approve(routerAID, tradeSize);
        // router0.getAmountsOut(amountIn, path0);
        // require(amounts[1] >= amountOutMin0, "Error SwapSingle: Insufficient output: LoanPool");
        uint256[] memory swapIn = routerA.swapExactTokensForTokens(
            tradeSize,
            amountOutA,
            path0,
            address(this),
            deadline
        );
        console.log("SwapSingle: first swap completed");
        // Approve the Uniswap router to spend the output tokens
        tokenOut.approve(routerBID, swapIn[1]);

        uint256[] memory amountsOut = routerB.getAmountsOut(swapIn[1], path1);
        require(amountsOut[1] > swapIn[1], "Error SwapSingle: Insufficient output: Target");
        // Perform the second swap
        routerB.swapExactTokensForTokens(swapIn[1], amountOutB, path1, to, deadline);
        console.log("SwapSingle: second swap completed");
        // Return any unspent tokens to the sender
        tokenIn.transfer(msg.sender, tokenIn.balanceOf(address(this)));
    }
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;

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

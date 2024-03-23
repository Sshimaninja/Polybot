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
        console.log("SwapSingle: swapSingle contract entered");
        IERC20 tokenIn = IERC20(path0[0]);
        IERC20 tokenOut = IERC20(path0[1]);
        IUniswapV2Router02 routerA = IUniswapV2Router02(routerAID);
        IUniswapV2Router02 routerB = IUniswapV2Router02(routerBID);

        approveTokens(tokenIn, tokenOut, routerAID, routerBID);
        // Check that the 'from' address has enough tokens
        uint256 balance = tokenIn.balanceOf(msg.sender);
        console.log("balance: ", balance);
        require(balance >= tradeSize, "SwapSingle: INSUFFICIENT_INPUT_AMOUNT");

        // Check that the 'from' address has approved the contract to transfer tokens
        uint256 allowance = tokenIn.allowance(msg.sender, address(this));
        console.log("allowance: ", allowance);
        require(allowance >= tradeSize, "SwapSingle: CONTRACT_NOT_APPROVED");

        console.log("tradeSize: ", tradeSize);
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

    function approveTokens(
        IERC20 tokenIn,
        IERC20 tokenOut,
        address routerAID,
        address routerBID
    ) internal {
        require(
            tokenIn.approve(routerAID, type(uint256).max),
            "approve routerA failed."
        );
        require(
            tokenOut.approve(routerBID, type(uint256).max),
            "approve routerB failed."
        );
        // end uniswap docs suggestions

        console.log("SwapSingle: tokens approved");
    }

    // function safeTransferFrom(address token, address from, address to, uint value) internal {
    //     // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
    //     (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
    //     require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
    // }
    // function approveContract(IERC20 token, uint256 amount) external {
    //     token.approve(address(this), );
    // }

    function transferTokensAndCheckAllowance(
        IERC20 tokenIn,
        IERC20 tokenOut,
        address routerA,
        address routerB,
        uint256 tradeSize
    ) internal {
        uint256 allowanceIn = tokenIn.allowance(address(this), routerA);
        console.log("Contract allowance for routerA: ", allowanceIn);

        uint256 allowanceOut = tokenOut.allowance(address(this), routerB);
        console.log("Contract allowance for routerB: ", allowanceOut);

        require(
            allowanceIn >= tradeSize,
            "SwapSingle: CONTRACT_NOT_APPROVED_FOR_ROUTERA"
        );
        require(
            allowanceOut >= tradeSize,
            "SwapSingle: CONTRACT_NOT_APPROVED_FOR_ROUTERB"
        );

        require(
            tokenIn.transferFrom(msg.sender, address(this), tradeSize),
            "transferFrom msg.sender failed."
        );
    }

    function performSwap(
        IUniswapV2Router02 routerA,
        IUniswapV2Router02 routerB,
        uint256 tradeSize,
        uint256 amountOutA,
        uint256 amountOutB,
        address[] memory path0,
        address[] memory path1,
        address to,
        uint256 deadline
    ) internal {
        IERC20 tokenIn = IERC20(path0[0]);
        IERC20 tokenOut = IERC20(path0[1]);
        // uint256[] memory amountOutA = routerA.getAmountsOut(tradeSize, path0);
        // require(
        //     amountsOutA[1] >= amountOut,
        //     "Error SwapSingle: routerA.getAmountsOut < amountOutA"
        // );

        uint256 balance = tokenIn.balanceOf(msg.sender);
        require(
            balance >= tradeSize,
            "SwapSingle: INSUFFICIENT_WALLET_BALANCE"
        );

        // According to Uniswap docs this contract needs to own the tokens it wants to swap, not just have an allowance.
        // https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/trading-from-a-smart-contract

        approveTokens(tokenIn, tokenOut, address(routerA), address(routerB));

        transferTokensAndCheckAllowance(
            tokenIn,
            tokenOut,
            address(routerA),
            address(routerB),
            tradeSize
        );

        uint256[] memory swapIn = routerA.swapExactTokensForTokens(
            tradeSize,
            amountOutA,
            path0,
            address(this),
            deadline
        );
        console.log("swapIn[1]: ", swapIn[1]);

        uint256[] memory swapOut = routerB.swapExactTokensForTokens( //this gets profit in tokenIn
            swapIn[1],
            amountOutB, //as much as possible of tokenIn
            path1,
            to,
            deadline
        );
        console.log("swapOut[1]: ", swapOut[1]);
    }
}

interface IUniswapV2Factory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address pair);
}

interface IUniswapV2Pair {
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external;
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
    )
        external
        view
        returns (uint112 reserveA, uint112 reserveB, uint32 blockTimestampLast);

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

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

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

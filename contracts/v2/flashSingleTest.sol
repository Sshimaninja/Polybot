//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "hardhat/console.sol";

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external;
}

contract flashSingleTest is IUniswapV2Callee {
    address owner;
    IUniswapV2Pair pair;
    using SafeMath for uint256;

    event log(string message);
    event logValue(string message, uint256 val);
    event logAddress(string message, address val);

    constructor(address _owner) {
        owner = _owner;
    }

    function checkOwner() public view returns (address) {
        return owner;
    }

    receive() external payable {}

    fallback() external payable {}

    function flashSwap(
        address loanFactory,
        address loanRouter,
        address targetRouter,
        address token0ID,
        address token1ID,
        uint256 amountIn, // tradeSize in tokenIn
        uint256 amountOut, // amountOutMin in tokenOut (flashSingle) (should == recipient amountOut)
        uint256 amountToRepay // amountRepay in tokenIn (flashSingle)
    ) external {
        console.log("Contract flashSingleTest Entered");
        require(msg.sender == address(owner), "Error: Only owner can call this function");
        pair = IUniswapV2Pair(IUniswapV2Factory(loanFactory).getPair(token0ID, token1ID));
        console.log("amountIn requested: ", amountIn);
        console.log("amountOut expected: ", amountOut);
        console.log("Contract Balance Before Swap: ", IERC20(token0ID).balanceOf(address(this)));
        console.log("Pair address: ", address(pair));
        require(address(pair) != address(0), "Error: Pair does not exist");
        bytes memory data = abi.encode(
            loanFactory,
            loanRouter,
            targetRouter,
            amountOut,
            amountToRepay
        );
        console.log("Data encoded");
        IERC20(token0ID).approve(address(pair), amountIn);
        console.log(amountIn, " of token0 approved for swap");
        pair.swap(
            amountIn, // requested borrow of token0
            0, // requested borrow of token1
            address(this),
            data
        );
        console.log("New Contract Balance (Token0):", IERC20(token0ID).balanceOf(address(this)));
        console.log("New Contract Balance (Token1):", IERC20(token1ID).balanceOf(address(this)));
        console.log("New Owner Balance (Token0):", IERC20(token0ID).balanceOf(owner));
        console.log("New Owner Balance (Token1):", IERC20(token1ID).balanceOf(owner));
    }

    function uniswapV2Call(
        address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data
    ) external override {
        console.log("uniswapV2Call Entered");
        address[] memory path = new address[](2);
        console.log("Decoding Loan Data");
        (
            address loanFactory,
            address loanRouter,
            address targetRouter,
            uint256 amountOut,
            uint256 amountRepay
        ) = abi.decode(_data, (address, address, address, uint256, uint256));
        console.log("Loan Data Decoded");
        path[0] = IUniswapV2Pair(msg.sender).token0();
        path[1] = IUniswapV2Pair(msg.sender).token1();
        pair = IUniswapV2Pair(IUniswapV2Factory(loanFactory).getPair(path[0], path[1]));
        console.log("Pair address: ", address(pair));
        console.log("msg.sender address: ", msg.sender);
        require(msg.sender == address(pair), "Error: Unauthorized");
        require(_sender == address(this), "Error: Not sender");
        require(_amount0 == 0 || _amount1 == 0, "Error: Invalid amounts");
        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);
        console.log("Amount0 requested: ", _amount0);
        console.log("Token0 address: ", path[0]);
        console.log("Amount1 expected: ", _amount1);
        console.log("Token1 address: ", path[1]);
        console.log(
            "New token0 balance (loaned):::::::::::::::::: ",
            token0.balanceOf(address(this))
        );

        // in this strategy, profit is token1
        (uint256[] memory swap, uint256[] memory repay) = getAmounts(
            _amount0,
            amountOut,
            amountRepay,
            path,
            loanRouter,
            targetRouter
        );

        console.log("getAmounts results: ");
        console.log("swap[0]: ", swap[0]);
        console.log("swap[1]: ", swap[1]);
        console.log("repay[0] ", repay[0]);
        console.log("repay[1] ", repay[1]);
        console.log("Final balances: ");
        console.log("Token0: ", token0.balanceOf(address(this)));
        console.log("Token1: ", token1.balanceOf(address(this)));
        console.log("Approving profit transfer.");
        token1.approve(address(address(this)), token1.balanceOf(address(this)));
        console.log("Approved");
        token1.transfer(owner, token1.balanceOf(address(this)));
        console.log("Transferred token1 to owner");
    }

    function getAmounts(
        uint256 _amount0,
        uint256 amountOut,
        uint256 amountRepay,
        address[] memory path,
        address loanRouter,
        address targetRouter
    ) internal returns (uint256[] memory swap, uint256[] memory repay) {
        uint256 deadline = block.timestamp + 5 minutes;
        // Define tokens
        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);
        swap = new uint256[](2);
        repay = new uint256[](2);

        console.log("Token balances: ");
        console.log("Token0: ", token0.balanceOf(address(this)));
        console.log("Token1: ", token1.balanceOf(address(this)));

        /*
		This seems to function correctly. Might be good to test on another block or live data.
		*/
        console.log("__________swapExactTokensForTokens_______________");
        token0.approve(targetRouter, _amount0);
        //https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02
        swap = IUniswapV2Router02(targetRouter).swapExactTokensForTokens(
            _amount0, //amountIn
            amountOut, //amountOutMin
            path, //token0, token1
            address(this),
            deadline
        );
        console.log("Swap complete");
        console.log("swap[0](token0): ", swap[0]);
        console.log("swap[1](token1): ", swap[1]);
        console.log("Token balances: ");
        console.log("Token0: ", token0.balanceOf(address(this)));
        console.log("Token1: ", token1.balanceOf(address(this)));

        console.log("_________________getAmountsIn______________________");
        //reverse the path to find how much token1 is needed to repay token0 loan.
        path[0] = IUniswapV2Pair(msg.sender).token1();
        path[1] = IUniswapV2Pair(msg.sender).token0();
        uint256[] memory getRepay = IUniswapV2Router02(loanRouter).getAmountsIn(
            _amount0, //amountOut
            path //(token1, token0)
        ); // TOKEN1
        console.log("getRepay0 (token1Required): ", getRepay[0]);
        console.log("getRepay1 (tokenInOutput)::: ", getRepay[1]);
        console.log("calc'd amountRepay: ", amountRepay);

        console.log("___________swapTokensForExactTokens__________");
        console.log("Approving loanRouter to trade getRepay");
        //If this doesn't work, I can try the swap on targetRouter
        token1.approve(loanRouter, token1.balanceOf(address(this)));
        console.log("Approved");
        repay = IUniswapV2Router02(loanRouter).swapTokensForExactTokens(
            swap[1], //amountOut
            getRepay[0], //amountInMax
            path, //(token1, token0)
            msg.sender,
            deadline
        );
        console.log("Repay complete");
        console.log("repay[0]: ", repay[0]);
        console.log("repay[1]: ", repay[1]);
        console.log("Token balances: ");
        console.log("Token0: ", IERC20(path[0]).balanceOf(address(this)));
        console.log("Token1: ", IERC20(path[1]).balanceOf(address(this)));
    }
}

//         console.log("_________________getAmountsIn______________________");

//         // uint256[] memory getRepay = IUniswapV2Router02(loanRouter).getAmountsOut(
//         //     _amount0, //amountOut
//         //     path //(token1, token0)
//         // ); // TOKEN1
//         path[0] = IUniswapV2Pair(msg.sender).token1();
//         path[1] = IUniswapV2Pair(msg.sender).token0();
//         uint256[] memory getRepay = IUniswapV2Router02(loanRouter)
//             .getAmountsOut(
//                 swap[1], //amountIn
//                 path //(token0, token1)
//             ); // TOKEN1
//         console.log("getRepay0 (token0Input):::: ", getRepay[0]);
//         console.log("getRepay1 (tokenOutOutput)::: ", getRepay[1]);
//         // console.log("calc'd amountRepay: ", amountRepay);

//         console.log("___________swapTokensForExactTokens__________");
//         console.log("Approving loanRouter to trade getRepay");
//         //If this doesn't work, I can try the swap on targetRouter
//         //reverse the path to find how much token1 is needed to repay token0 loan.

//         token1.approve(loanRouter, token1.balanceOf(address(this)));
//         console.log("Approved");
//         repay = IUniswapV2Router02(loanRouter).swapTokensForExactTokens(
//             swap[1], //amountOut
//             getRepay[1], //amountInMax
//             path, //(token1, token0)
//             msg.sender,
//             deadline
//         );
//         console.log("Repay complete");
//         console.log("repay[0]: ", repay[0]);
//         console.log("repay[1]: ", repay[1]);
//         console.log("Token balances: ");
//         console.log("Token0: ", IERC20(path[0]).balanceOf(address(this)));
//         console.log("Token1: ", IERC20(path[1]).balanceOf(address(this)));
//     }
// }

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

library SafeMath {
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }

    function div(uint x, uint y) internal pure returns (uint z) {
        require(y > 0, "ds-math-div-by-zero");
        z = x / y;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    }

    function mod(uint x, uint y) internal pure returns (uint z) {
        require(y != 0, "ds-math-mod-by-zero");
        z = x % y;
    }
}

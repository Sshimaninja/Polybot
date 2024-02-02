//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import 'hardhat/console.sol';

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata
    ) external;
}

contract flashMultiTest is IUniswapV2Callee {
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

    fallback() external payable {}
    receive() external payable {}

    function flashSwap(
        address loanFactory,
        address loanRouter,
        address recipientRouter,
        address token0ID,
        address token1ID,
        uint256 amount0In, // amount of token0 to borrow
        uint256 amount1Out, // amountOutMin (expected). This should be at least the amount to repay the loan
        uint256 amountToRepay // amount of tokenOut to repay (flashMulti)
    ) external {
        console.log('Contract flashMultiTest Entered');
        console.log('Owner: ', owner);
        console.log('Loan Factory: ', loanFactory);
        console.log('Loan Router: ', loanRouter);
        console.log('Recipient Router: ', recipientRouter);
        console.log('Token0: ', token0ID);
        console.log('Token1: ', token1ID);
        console.log('Amount0In: ', amount0In);
        console.log('Amount1Out: ', amount1Out);
        console.log('AmountToRepay: ', amountToRepay);
        require(
            msg.sender == address(owner),
            'Error: Only owner can call this function'
        );
        pair = IUniswapV2Pair(
            IUniswapV2Factory(loanFactory).getPair(token0ID, token1ID)
        );

        console.log('amount0In requested: ', amount0In);
        console.log('amount1Out expected: ', amount1Out);
        console.log(
            'Contract Balance Before Swap: ',
            IERC20(token0ID).balanceOf(address(this))
        );
        console.log('Pair address: ', address(pair));

        require(address(pair) != address(0), 'Error: Pair does not exist');
        bytes memory data = abi.encode(
            loanFactory,
            loanRouter,
            recipientRouter,
            amount1Out,
            amountToRepay
        );
        console.log('Data encoded');
        IERC20(token0ID).approve(address(pair), amount0In);
        require(
            amount0In > 0,
            'Error: Invalid amount0In: amount0In must be greater than 0'
        );
        pair.swap(
            amount0In, // Requested borrow of token0
            0, // Borrow of token1
            address(this), // Address to send swap callback to
            data // Encoded data for callback
        );
        console.log(
            'New Contract Balance (Token0):',
            IERC20(token0ID).balanceOf(address(this))
        );
        console.log(
            'New Contract Balance (Token1):',
            IERC20(token1ID).balanceOf(address(this))
        );
        console.log(
            'New Owner Balance (Token0):',
            IERC20(token0ID).balanceOf(owner)
        );
        console.log(
            'New Owner Balance (Token1):',
            IERC20(token1ID).balanceOf(owner)
        );
    }

    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        console.log('uniswapV2Call Entered');
        address[] memory path = new address[](2);
        console.log('Decoding Loan Data');
        (
            address loanFactory,
            address loanRouter,
            address recipientRouter,
            uint256 amount1Out,
            uint256 amount1Repay
        ) = abi.decode(data, (address, address, address, uint256, uint256));
        console.log('Loan Data Decoded');
        console.log('loanFactory: ', loanRouter);

        //This works because we are only requesting then swapping one token
        path[0] = IUniswapV2Pair(msg.sender).token0();
        path[1] = IUniswapV2Pair(msg.sender).token1();
        pair = IUniswapV2Pair(
            IUniswapV2Factory(loanFactory).getPair(path[0], path[1])
        );
        uint256 prek = getK();
        console.log('Uniswap K Before Swap: ', prek);

        console.log('LoanPool address: ', address(pair));
        console.log('Target address: ', address(this));
        console.log('msg.sender address: ', msg.sender);
        require(msg.sender == address(pair), 'Error: Unauthorized');
        require(sender == address(this), 'Error: Not sender');
        require(amount0 == 0 || amount1 == 0, 'Error: Invalid amounts');
        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);
        console.log('Amount0 requested: ', amount0);
        console.log('Token0 address: ', path[0]);
        console.log('Amount1 expected: ', amount1);
        console.log('Token1 address: ', path[1]);
        console.log(
            'New token0 balance (loaned):::::::::::::::::: ',
            token0.balanceOf(address(this))
        );
        console.log('Approving recipientRouter to trade token0');
        token0.approve(address(recipientRouter), amount0);
        console.log(
            'Approved to trade ',
            amount0,
            ' of token0 on recipientRouter'
        );
        console.log('balance Token0: ', token0.balanceOf(address(this)));
        console.log('balance Token1: ', token1.balanceOf(address(this)));
        // uint256[] memory amounts = new uint256[](2);
        // amounts[0] = 0;
        // amounts[1] = 0;
        uint256 amountOut = getAmounts(
            amount0,
            amount1Repay,
            amount1Out,
            loanRouter,
            recipientRouter,
            path
        );
        console.log('Amount out after repayment: ', amountOut);
        console.log('New balance of token1: ', token1.balanceOf(address(this)));
        token1.transfer(owner, token1.balanceOf(address(this)));
        console.log('Transferred token1 to owner');
    }

    function getAmounts(
        uint256 loanAmount,
        uint256 amount1Repay,
        uint256 amount1Out,
        address loanRouter,
        address recipientRouter,
        address[] memory path
    ) public returns (uint256 amountOut) {
        console.log('getAmounts Entered');
        console.log('Loan Amount: ', loanAmount);
        console.log('Amount1Repay: ', amount1Repay);
        console.log('Amount1Out: ', amount1Out);
        console.log('Loan Router: ', loanRouter);
        console.log('Recipient Router: ', recipientRouter);

        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);
        uint256 deadline = block.number + 5 minutes;
        uint256[] memory repay = getRepay(loanAmount, loanRouter, path);
        console.log('Repayment calculated: ', repay[0]);
        console.log('Repayment expected: ', amount1Repay);
        console.log('Swapping ', loanAmount, ' token0 for token1');
        console.log('MINIMUM Amount1 expected: ', amount1Out);
        amountOut = IUniswapV2Router02(address(recipientRouter))
        // swap exactly loanAmount token0 for minimum amount1Repay token1
            .swapExactTokensForTokens(
                loanAmount,
                amount1Out,
                path,
                address(this),
                deadline
            )[1];
        console.log('Swap 1 complete');
        console.log('Amount out recieved: ', amountOut);
        console.log('Amount out expected: ', amount1Out);
        console.log('Repayment expected:: ', amount1Repay);
        console.log('Repayment calcuated: ', repay[0]);

        token1.approve(msg.sender, amount1Repay);

        console.log('Approved to trade ', amount1Repay, ' of token1');

        token1.transferFrom(address(this), msg.sender, repay[0]);

        console.log('Transfered ', amount1Repay, ' of token1 to loanPool');
        console.log('balance Token0: ', token0.balanceOf(address(this)));
        console.log('balance Token1: ', token1.balanceOf(address(this)));

        uint256 kpost = getK();

        console.log('Uniswap K After Swap: ', kpost);
        console.log('Repay complete');
    }

    function getRepay(
        uint256 loanAmount,
        address loanRouter,
        address[] memory path
    ) internal view returns (uint256[] memory repay) {
        // Reverse path and check the amount of token1 needed from swapExactTokensForTokens to repay the loan
        path[0] = IUniswapV2Pair(msg.sender).token1();
        path[1] = IUniswapV2Pair(msg.sender).token0();
        repay = IUniswapV2Router02(loanRouter).getAmountsIn(loanAmount, path);
    }

    function getK() public view returns (uint256 k) {
        (uint112 reserveA, uint112 reserveB, ) = pair.getReserves();
        k = uint256(reserveA).mul(uint256(reserveB)); // convert uint112 to uint256 before multiplication
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
        bytes calldata
    ) external;

    function token0() external view returns (address);

    function token1() external view returns (address);

    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
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

    function getAmountsIn(
        address factory,
        uint amountOut,
        address[] memory path
    ) external view returns (uint[] memory amounts);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);

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
        address[] calldata,
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
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }
}

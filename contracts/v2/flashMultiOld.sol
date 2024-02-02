// //SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.19;

// import 'hardhat/console.sol';

// interface IUniswapV2Callee {
//     function uniswapV2Call(
//         address sender,
//         uint amount0,
//         uint amount1,
//         bytes calldata
//     ) external;
// }

// contract flashMulti is IUniswapV2Callee {
//     address owner;
//     IUniswapV2Pair pair;
//     using SafeMath for uint256;

//     event log(string message);
//     event logValue(string message, uint256 val);
//     event logAddress(string message, address val);

//     constructor(address _owner) {
//         owner = _owner;
//     }

//     function checkOwner() public view returns (address) {
//         return owner;
//     }

//     function flashSwap(
//         address loanFactory,
//         address loanRouter,
//         address recipientRouter,
//         address token0ID,
//         address token1ID,
//         uint256 amount0In, // amount of token0 to borrow
//         uint256 amount1Out, // amountOutMin (expected). This should be at least the amount to repay the loan
//         uint256 amountToRepay // amount of tokenOut to repay (flashMulti)
//     ) external {
//         emit log('Contract flashMultiTest Entered');
//         require(
//             msg.sender == address(owner),
//             'Error: Only owner can call this function'
//         );
//         pair = IUniswapV2Pair(
//             IUniswapV2Factory(loanFactory).getPair(token0ID, token1ID)
//         );
//         emit logValue('amount0In requested: ', amount0In);
//         emit logValue('amount1Out expected: ', amount1Out);
//         emit logValue(
//             'Contract Balance Before Swap: ',
//             IERC20(token0ID).balanceOf(address(this))
//         );
//         emit logAddress('Pair address: ', address(pair));
//         require(address(pair) != address(0), 'Error: Pair does not exist');
//         bytes memory data = abi.encode(
//             loanFactory,
//             loanRouter,
//             recipientRouter,
//             amount1Out,
//             amountToRepay
//         );
//         emit log('Data encoded');
//         IERC20(token0ID).approve(address(pair), amount0In);
//         pair.swap(
//             amount0In, // Requested borrow of token0
//             0, // Borrow of token1
//             address(this), // Address to send swap callback to
//             data // Encoded data for callback
//         );
//         emit logValue(
//             'New Contract Balance (Token0):',
//             IERC20(token0ID).balanceOf(address(this))
//         );
//         emit logValue(
//             'New Contract Balance (Token1):',
//             IERC20(token1ID).balanceOf(address(this))
//         );
//         emit logValue(
//             'New Owner Balance (Token0):',
//             IERC20(token0ID).balanceOf(owner)
//         );
//         emit logValue(
//             'New Owner Balance (Token1):',
//             IERC20(token1ID).balanceOf(owner)
//         );
//     }

//     function uniswapV2Call(
//         address _sender,
//         uint256 _amount0,
//         uint256 _amount1,
//         bytes calldata _data
//     ) external override {
//         emit log('uniswapV2Call Entered');
//         address[] memory path = new address[](2);
//         emit log('Decoding Loan Data');
//         (
//             address loanFactory,
//             address loanRouter,
//             address recipientRouter,
//             uint256 amount1Out,
//             uint256 amount1Repay
//         ) = abi.decode(_data, (address, address, address, uint256, uint256));
//         emit log('Loan Data Decoded');
//         emit logAddress('loanFactory: ', loanRouter);
//         //This only works because we are only requesting then swapping one token
//         path[0] = IUniswapV2Pair(msg.sender).token0();
//         path[1] = IUniswapV2Pair(msg.sender).token1();
//         pair = IUniswapV2Pair(
//             IUniswapV2Factory(loanFactory).getPair(path[0], path[1])
//         );
//         emit logAddress('LoanPool address: ', address(pair));
//         emit logAddress('Target address: ', address(this));
//         emit logAddress('msg.sender address: ', msg.sender);
//         require(msg.sender == address(pair), 'Error: Unauthorized');
//         require(_sender == address(this), 'Error: Not sender');
//         require(_amount0 == 0 || _amount1 == 0, 'Error: Invalid amounts');
//         IERC20 token0 = IERC20(path[0]);
//         IERC20 token1 = IERC20(path[1]);
//         emit logValue('Amount0 requested: ', _amount0);
//         emit logAddress('Token0 address: ', path[0]);
//         emit logValue('Amount1 expected: ', _amount1);
//         emit logAddress('Token1 address: ', path[1]);
//         emit logValue(
//             'New token0 balance (loaned):::::::::::::::::: ',
//             token0.balanceOf(address(this))
//         );
//         emit log('Approving recipientRouter to trade token0');
//         token0.approve(address(recipientRouter), _amount0);
//         emit logValue('Approved to trade ', _amount0);
//         emit logValue('balance Token0: ', token0.balanceOf(address(this)));
//         emit logValue('balance Token1: ', token1.balanceOf(address(this)));
//         // uint256[] memory amounts = new uint256[](2);
//         // amounts[0] = 0;
//         // amounts[1] = 0;
//         uint256 amountOut = getAmounts(
//             _amount0,
//             amount1Repay,
//             amount1Out,
//             // loanRouter,
//             recipientRouter,
//             path
//         );
//         emit logValue(
//             'New balance of token1: ',
//             token1.balanceOf(address(this))
//         );
//         token1.transfer(owner, token1.balanceOf(address(this)));
//         emit log('Transferred token1 to owner');
//     }

//     function getAmounts(
//         uint256 loanAmount,
//         uint256 amount1Repay,
//         uint256 amount1Out,
//         // address loanRouter,
//         address recipientRouter,
//         address[] memory path
//     ) internal returns (uint256 amountOut) {
//         IERC20 token0 = IERC20(path[0]);
//         IERC20 token1 = IERC20(path[1]);
//         uint256 deadline = block.timestamp + 5 minutes;
//         amountOut = IUniswapV2Router02(address(recipientRouter))
//         // swap exactly loanAmount token0 for minimum amount1Repay token1
//             .swapTokensForExactTokens(
//                 amount1Out, // loanAmount
//                 // amount1Repay, // repayment (expected). Remainder is profit (results in insufficient output amount error)
//                 loanAmount, // best amountOut (expected). Remainder is profit (This can be interchanged with amount1Repay, for a safer but less potentially less profitable swap)
//                 path, // path
//                 address(this), // HOPING THAT SENDING THIS TO PAIR ADDRESS SIMPLIFIES EVERYTHING.
//                 deadline // deadline
//             )[1];
//         emit log('Swap 1 complete');
//         emit logValue('Amount out recieved: ', amountOut);
//         emit logValue('Amount out expected: ', amount1Out);
//         emit logValue('Repayment expected:: ', amount1Repay);
//         token1.approve(address(this), amount1Repay);
//         emit logValue('Approved to trade token1 ', amount1Repay);
//         token1.transfer(address(pair), amount1Repay);
//         emit logValue('Transfered to loanPool', amount1Repay);
//         emit logValue('balance Token0: ', token0.balanceOf(address(this)));
//         emit logValue('balance Token1: ', token1.balanceOf(address(this)));
//         // emit logValue("Calculating repayment in token1");
//         // uint256 repay = IUniswapV2Router02(loanRouter).getAmountsOut(
//         // 	amountOut,
//         // 	path
//         // )[path.length-1];
//         // emit logValue("Amount repay expected::::: ", amount1Out);
//         // emit logValue("Amount repay calculated::: ", repay);
//         // emit logValue("Amount in contract: ", token1.balanceOf(address(this)));
//         // emit logValue("Approving loanRouter to repay loanPool");
//         // // token1.approve(address(loanRouter), repay);
//         // emit logValue("Approved to trade ", repay, " of token1 on loanRouter");
//         //repay loanPool
//         // token1.transfer(address(pair), repay);
//         // Attempting a second swap is triggering Uniswap: Locked re-entrancy guard.
//         // Using getAmountsOut and simple transfer is probably cheaper anyway.
//         // token1.approve(address(loanRouter), amountOut);
//         // uint256 repay = IUniswapV2Router02(loanRouter)
//         // 	.swapTokensForExactTokens(
//         // 		amount, // amountOut
//         // 		loanAmount,
//         // 		path,
//         // 		msg.sender,
//         // 		deadline
//         // 	)[0];//Could be that this is wrong.
//         emit log('Repay complete');
//         // emit logValue("Amount repay calculated::: ", repay);
//         // amounts[1] = repay;
//     }
// }

// interface IUniswapV2Factory {
//     function getPair(
//         address tokenA,
//         address tokenB
//     ) external view returns (address pair);
// }

// interface IUniswapV2Pair {
//     function swap(
//         uint amount0Out,
//         uint amount1Out,
//         address to,
//         bytes calldata
//     ) external;

//     function token0() external view returns (address);

//     function token1() external view returns (address);
// }

// interface IUniswapV2Library {
//     function getReserves(
//         address factory,
//         address tokenA,
//         address tokenB
//     )
//         external
//         view
//         returns (uint112 reserveA, uint112 reserveB, uint32 blockTimestampLast);

//     function getAmountsIn(
//         address factory,
//         uint amountOut,
//         address[] memory path
//     ) external view returns (uint[] memory amounts);
// }

// interface IERC20 {
//     function approve(address spender, uint256 amount) external returns (bool);

//     function balanceOf(address account) external view returns (uint256);

//     function transfer(
//         address recipient,
//         uint256 amount
//     ) external returns (bool);

//     function transferFrom(
//         address sender,
//         address recipient,
//         uint256 amount
//     ) external returns (bool);
// }

// interface IUniswapV2Router02 {
//     function swapExactTokensForTokens(
//         uint amountIn,
//         uint amountOutMin,
//         address[] calldata,
//         address to,
//         uint deadline
//     ) external returns (uint[] memory amounts);

//     function swapTokensForExactTokens(
//         uint amountOut,
//         uint amountInMax,
//         address[] calldata path,
//         address to,
//         uint deadline
//     ) external returns (uint[] memory amounts);

//     function getAmountsOut(
//         uint amountIn,
//         address[] memory path
//     ) external view returns (uint[] memory amounts);

//     function getAmountsIn(
//         uint amountOut,
//         address[] memory path
//     ) external view returns (uint[] memory amounts);
// }

// library SafeMath {
//     function add(uint x, uint y) internal pure returns (uint z) {
//         require((z = x + y) >= x, 'ds-math-add-overflow');
//     }

//     function sub(uint x, uint y) internal pure returns (uint z) {
//         require((z = x - y) <= x, 'ds-math-sub-underflow');
//     }

//     function mul(uint x, uint y) internal pure returns (uint z) {
//         require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
//     }
// }

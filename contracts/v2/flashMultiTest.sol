//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

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

    function flashSwap(
        address loanFactory,
        address loanRouter,
        address recipientRouter,
        address token0ID,
        address token1ID,
        uint256 amount0In,
        uint256 amount1Out,
        uint256 amountToRepay
    ) external {
        require(
            msg.sender == address(owner),
            'Error: Only owner can call this function'
        );
        pair = IUniswapV2Pair(
            IUniswapV2Factory(loanFactory).getPair(token0ID, token1ID)
        );
        require(address(pair) != address(0), 'Error: Pair does not exist');
        bytes memory data = abi.encode(
            loanFactory,
            loanRouter,
            recipientRouter,
            amount1Out,
            amountToRepay
        );
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
    }

    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        address[] memory path = new address[](2);
        (
            address loanFactory,
            address loanRouter,
            address recipientRouter,
            uint256 amount1Out,
            uint256 amount1Repay
        ) = abi.decode(data, (address, address, address, uint256, uint256));

        //This only works because we are only requesting then swapping one token
        path[0] = IUniswapV2Pair(msg.sender).token0();
        path[1] = IUniswapV2Pair(msg.sender).token1();
        pair = IUniswapV2Pair(
            IUniswapV2Factory(loanFactory).getPair(path[0], path[1])
        );

        require(msg.sender == address(pair), 'Error: Unauthorized');
        require(sender == address(this), 'Error: Not sender');
        require(amount0 == 0 || amount1 == 0, 'Error: Invalid amounts');

        IERC20 token1 = IERC20(path[1]);

        uint256 amountOut = getAmounts(
            amount0,
            amount1Repay,
            amount1Out,
            loanRouter,
            recipientRouter,
            path
        );
        token1.transfer(owner, token1.balanceOf(address(this)));
    }

    function getAmounts(
        uint256 loanAmount,
        uint256 amount1Repay,
        uint256 amount1Out,
        address loanRouter,
        address recipientRouter,
        address[] memory path
    ) public returns (uint256 amountOut) {
        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);
        uint256 deadline = block.number + 10;
        uint256[] memory repay = getRepay(loanAmount, loanRouter, path);
        token0.approve(address(recipientRouter), loanAmount);
        amountOut = IUniswapV2Router02(address(recipientRouter))
        // swap exactly loanAmount token0 for minimum amount1Repay token1
            .swapExactTokensForTokens(
                loanAmount,
                amount1Out,
                path,
                address(this),
                deadline
            )[1];

        token1.approve(msg.sender, repay[0]);
        token1.transferFrom(address(this), msg.sender, repay[0]);
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

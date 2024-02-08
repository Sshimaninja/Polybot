pragma solidity ^0.8.19;

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external;
}

contract flashMulti is IUniswapV2Callee {
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
        uint256 amountIn,
        uint256 amountOut,
        uint256 amountToRepay
    ) external {
        require(msg.sender == address(owner), "Error: Only owner can call this function");
        pair = IUniswapV2Pair(IUniswapV2Factory(loanFactory).getPair(token0ID, token1ID));
        require(address(pair) != address(0), "Error: Pair does not exist");
        bytes memory data = abi.encode(
            loanFactory,
            loanRouter,
            targetRouter,
            amountOut,
            amountToRepay
        );
        IERC20(token0ID).approve(address(pair), amountIn);
        pair.swap(amountIn, 0, address(this), data);
    }

    function uniswapV2Call(
        address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data
    ) external override {
        address[] memory path = new address[](2);

        (
            address loanFactory,
            address loanRouter,
            address targetRouter,
            uint256 amountOut,
            uint256 amountRepay
        ) = abi.decode(_data, (address, address, address, uint256, uint256));

        path[0] = IUniswapV2Pair(msg.sender).token0();
        path[1] = IUniswapV2Pair(msg.sender).token1();
        pair = IUniswapV2Pair(IUniswapV2Factory(loanFactory).getPair(path[0], path[1]));

        require(msg.sender == address(pair), "Error: Unauthorized");
        require(_sender == address(this), "Error: Not sender");
        require(_amount0 == 0 || _amount1 == 0, "Error: Invalid amounts");
        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);

        (uint256[] memory swap, uint256[] memory repay) = getAmounts(
            _amount0,
            amountOut,
            amountRepay,
            path,
            loanRouter,
            targetRouter
        );

        token1.approve(address(address(this)), token1.balanceOf(address(this)));

        token1.transfer(owner, token1.balanceOf(address(this)));
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

        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);
        swap = new uint256[](2);
        repay = new uint256[](2);

        token0.approve(targetRouter, _amount0);

        swap = IUniswapV2Router02(targetRouter).swapExactTokensForTokens(
            _amount0,
            amountOut,
            path,
            address(this),
            deadline
        );

        path[0] = IUniswapV2Pair(msg.sender).token1();
        path[1] = IUniswapV2Pair(msg.sender).token0();
        uint256[] memory getRepay = IUniswapV2Router02(loanRouter).getAmountsIn(_amount0, path);

        token1.approve(loanRouter, token1.balanceOf(address(this)));

        token1.transfer(address(pair), getRepay[0]);
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
    }

    function mod(uint x, uint y) internal pure returns (uint z) {
        require(y != 0, "ds-math-mod-by-zero");
        z = x % y;
    }
}

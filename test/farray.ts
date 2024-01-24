/*
This is a simple file to demonstrate that if statemends within forEach loops are acceptible. 
Therefore the error in flashit & flashitEthers is something else.
It may be some kind of syntax error. I'll need to go over it line-by-line again.
*/



async function questiondata() {
    let fata =
        [
            {
                pair:
                {
                    ticker: "WMATIC/WETH",
                    token0symbol: "WMATIC",
                    token1symbol: "WETH",
                    token0: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
                    token1: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                    token0decimals: 18,
                    token1decimals: 18,
                },
                SUSHI:
                {
                    poolID: "0xc4e595acdd7d12fec385e5da5d43160e8a0bac0e",
                    Price0: "1370.616202606639456478134957478409",
                    Price1: "0.0007295988461964763440730837123229828",
                    amountIn: "1000.0",
                    amountOut: "0.727109784031312437",
                    TVLUSD: "4087116.481926683784728757044474299",
                },
                QUICK:
                {
                    poolID: "0x479e1b71a702a595e19b6d5932cd5c863ab57ee0",
                    Price0: "1373.26546715506397529904256662325",
                    Price1: "0.0007281913249239840954793413228093213",
                    amountIn: "1000.0",
                    amountOut: "0.726205510152213321",
                    TVLUSD: "3423832.685666003967042580804698148",
                },
                gas:
                {
                    gasLimit: 1500000000,
                    gasPrice: 32656007644,
                    gasCost: 48984011466000000000,
                },
                diffPercent: 0.12452038251672666,
                direction:
                {
                    direction: "Quick Token0 -> Sushi Token1",
                    verbose: "Flash V2b token0 to V2a token1, sell V2a token1 for V2b token0 to repay the loan and keep the profit",
                    tokenIn: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
                    tokenOut: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                    flashPool: "0x479e1b71a702a595e19b6d5932cd5c863ab57ee0",
                    recipient: "0xc4e595acdd7d12fec385e5da5d43160e8a0bac0e",
                    deadline: 2000,
                    amountIn: "1000.0",
                    data: [Object],
                },
            },
            {
                pair:
                {
                    ticker: "USDC/WETH",
                    token0symbol: "USDC",
                    token1symbol: "WETH",
                    token0: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
                    token1: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                    token0decimals: 6,
                    token1decimals: 18,
                },
                SUSHI:
                {
                    poolID: "0x34965ba0ac2451a34a0471f04cca3f990b8dea27",
                    Price0: "1160.750879719079472220140204297753",
                    Price1: "0.0008615113005488449073917522487400194",
                    amountIn: "1000.0",
                    amountOut: "0.858507553579038776",
                    TVLUSD: "1782708.355146489995193896603378067",
                },
                QUICK:
                {
                    poolID: "0x55caabb0d2b704fd0ef8192a7e35d8837e678207",
                    Price0: "1157.46520052442757132918497606235",
                    Price1: "0.0008639568598234462705829954673792926",
                    amountIn: "1000.0",
                    amountOut: "0.859205587908267284",
                    TVLUSD: "4880559.055814340377312480040511294",
                },
                gas:
                {
                    gasLimit: 1500000000,
                    gasPrice: 32656007644,
                    gasCost: 48984011466000000000,
                },
                diffPercent: 0.08130788439991082,
                direction:
                {
                    direction: "Sushi Token0 -> Quick Token1",
                    verbose: "Flash V2a token0 to V2b token1, sell v2b token1 for V2a token0 to repay the loan and keep the profit",
                    tokenIn: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
                    tokenOut: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
                    flashPool: "0x34965ba0ac2451a34a0471f04cca3f990b8dea27",
                    recipient: "0x55caabb0d2b704fd0ef8192a7e35d8837e678207",
                    deadline: 2000,
                    amountIn: "1000.0",
                    data: [Object],
                },
            },
        ]
    return fata;
}
// data()

async function main() {
    let farray = await questiondata();
    farray.forEach(pair => {
        let token0 = pair.pair.token0;
        let token1 = pair.pair.token1;
        console.log("Testtoken0token1: " + token0, token1);
        if (pair.direction.direction == 'Quick Token0 -> Sushi Token1') { //I may need to use either use an array method or a switch statement to make this more efficient
            var exchangeA = 'Quickswap'//For console output
            var exchangeB = 'Sushiswap'
            console.log("Exchange A: " + exchangeA)//DEBUG
            console.log("Exchange B: " + exchangeB)//DEBUG
        } else if (pair.direction.direction == 'Sushi Token0 -> Quick Token1') {
            var exchangeA = 'Sushiswap'
            var exchangeB = 'Quickswap'
            console.log("Exchange A: " + exchangeA)//DEBUG
            console.log("Exchange B: " + exchangeB)//DEBUG
        } else {
            console.log("Error: Data not found")//DEBUG
            return
        }
        console.log(exchangeA)//DEBUG
        console.log(exchangeB)//DEBUG
    });
    console.log(farray);
}
main()
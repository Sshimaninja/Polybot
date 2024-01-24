



const n = (1.3421077739917222e+24).toString()

function toFixed() {
    var nparse = parseFloat(n).toFixed(6)
    var nround = Math.round(Number(n))
    console.log(nparse)
    console.log(nround)
}
toFixed()
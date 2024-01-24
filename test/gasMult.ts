function increasegasMult() {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    var gasMult = 1;  // Declare and initialize gasMult outside the for loop
    array.forEach(element => {
        gasMult += 1.5;  // Increment gasMult in each iteration of the forEach loop
        console.log("GasMult: " + gasMult)  // Print the value of gasMult
    });
}
increasegasMult();

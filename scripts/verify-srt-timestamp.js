
function pad(value) {
    return value.toString().padStart(2, "0");
}

function formatTimestamp(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.round(totalSeconds * 1000) % 1000;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${ms.toString().padStart(3, "0")}`;
}

const tests = [
    { input: 0, expected: "00:00:00,000" },
    { input: 0.123, expected: "00:00:00,123" },
    { input: 1.5, expected: "00:00:01,500" },
    { input: 61.005, expected: "00:01:01,005" },
    { input: 3661.999, expected: "01:01:01,999" },
];

tests.forEach(test => {
    const result = formatTimestamp(test.input);
    if (result === test.expected) {
        console.log(`PASS: ${test.input} => ${result}`);
    } else {
        console.log(`FAIL: ${test.input} => ${result} (expected ${test.expected})`);
        process.exit(1);
    }
});

console.log("All tests passed!");

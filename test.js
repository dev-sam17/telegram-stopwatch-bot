require('dotenv').config({ path: './.test.env' });
const { getStatus, startStopwatch, stopStopwatch, resetStopwatch, clearAllData } = require('./timer');

function delay(seconds = 0) {
    return new Promise((resolve) =>
        setTimeout(resolve, seconds)
    );
}

console.log(process.env.DB_NAME);

async function testTimer() {
    await clearAllData()

    const status = await getStatus();
    if(status.active === 0) {
        console.log('0 Passed');
    } else {
        console.log('0 Failed');
    }

    const startTime = await startStopwatch()
    startTime.active === 0 ? console.log("1 passed") : console.log('1 Failed');

    await delay(1000);

    const status2 = await getStatus();
    if(status2.active > 0) {
        console.log('1.5 Passed');
    } else {
        console.log(' 1.5 Failed');
    }

    await delay(2000);

    const startTime2 = await startStopwatch();
    if (startTime2.active > 0) { console.log("2 passed") } else { console.log('2 Failed'); }

    await delay(3000);

    const stopTime = await stopStopwatch()
    stopTime.time === 6 && stopTime.activeSession > 0 ? console.log("3 passed") : console.log('3 Failed');

    await delay(2000)

    const status3 = await getStatus();
    if(status3.active > 0) {
        console.log('3.5 Passed');
    } else {
        console.log('3.5 Failed');
    }

    const stopTime2 = await stopStopwatch()
    stopTime2.activeSession === 0 ? console.log("4 passed") : console.log('4 Failed');

    await delay(2000)

    // const startTime3 = await startStopwatch()
    // startTime3.paused > 0 ? console.log("5 passed") : console.log('5 Failed');

    // await delay(2000)

    const resetTime = await resetStopwatch();
    resetTime.affectedRows > 0 ?
        console.log("6 passed") : console.log("6 failed");
}

testTimer();

const { startStopwatch, stopStopwatch, resetStopwatch, getHistory, clearAllData } = require('./timer');

function delay(seconds = 0) {
    return new Promise((resolve) =>
        setTimeout(resolve, seconds )
    );
}

async function testTimer() {
    await clearAllData()

    const startTime = await startStopwatch()
    console.log('1', startTime)

    startTime.active === 0 && startTime.paused === 0 ?  console.log("1 passed") : console.log('1 Failed')

    await delay(2000);

    const startTime2 = await startStopwatch();
    console.log('2', startTime2)

    if(startTime2.active > 0 && startTime2.paused === 0) { console.log("2 passed") }else {console.log('2 Failed');}

    await delay(3000);

    const stopTime = await stopStopwatch()
    stopTime.time === 5 && stopTime.activeSession > 0 ? console.log("3 passed") : console.log('3 Failed');

    await delay(2000)

    const stopTime2 = await stopStopwatch()
    stopTime2.activeSession === 0 ? console.log("4 passed") : console.log('4 Failed');

    await delay(2000)

    const startTime3 = await startStopwatch()
    startTime3.paused > 0 ? console.log("5 passed") : console.log('5 Failed');

    await delay(2000)

    const resetTime = await resetStopwatch();
    resetTime.affectedRows > 0 ? 
        console.log("6 passed") : console.log("6 failed");
}

testTimer();

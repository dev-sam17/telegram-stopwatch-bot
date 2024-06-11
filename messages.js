module.exports = {
    status: {
        running: 'Stopwatch is running\n\n',
        paused: 'Stopwatch is paused\n\n',
        notRunning: 'Stopwatch is not running'
    },
    start: {
        running: 'Stopwatch is already running',
        resume: 'Stopwatch resumed',
        started: 'Stopwatch started'
    },
    stop: {
        noActive: 'No active stopwatch to stop.',
        stopped: (time) => `Stopwatch stopped Time: ${formatSeconds(time)}`
    },
    reset: 'Stopwatch and current session reset',
    history: {
        header: 'Timer Sessions History:\n\n',
        subHeader: (timerId) => `Timer ${timerId}: \n`,
        session: (index, startTime, stopTime, totalTime) => `Session ${index + 1}: \n ${startTime} - ${stopTime} - ${formatSeconds(totalTime)} \n`,
        total: (total) => `Total Duration: ${formatSeconds(total)} \n\n`
    }
}

const momentDuration = require('moment');
require('moment-duration-format');

function formatSeconds(seconds) {
    const duration = momentDuration.duration(seconds, 'seconds');
  
    const hours = duration.hours();
    const minutes = duration.minutes();
    const secs = duration.seconds();
  
    let formatted = '';
  
    if (hours > 0) {
      formatted += `${hours}h `;
    }
  
    if (minutes > 0) {
      formatted += `${minutes}m `;
    }
  
    if (secs > 0 || (hours === 0 && minutes === 0)) {
      formatted += `${secs}s`;
    }
  
    return formatted.trim();
  }
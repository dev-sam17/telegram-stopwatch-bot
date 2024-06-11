module.exports = {
    status: {
        running: 'Timer is running\n\n',
        paused: 'Timer is paused\n\n',
        notRunning: 'Timer is not running'
    },
    start: {
        running: 'Timer is already running',
        resume: 'Timer resumed with new session',
        started: 'Timer started with new session'
    },
    stop: {
        noActive: 'No active session to stop.',
        stopped: (time) => `Timer stopped. Elapsed Time: ${formatSeconds(time)}. Current Session Ended`
    },
    reset: 'Timer and current session reset',
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
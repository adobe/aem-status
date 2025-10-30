/**
 * AEM Service Level Objective Calculator
 * 
 * This library provides functions to calculate service level objectives
 * for AEM Edge Delivery Services based on incident data.
 * 
 * Can be used both locally (aemstatus.net) and remotely (www.aem.live)
 */

/**
 * Helper function to parse ISO 8601 timestamp format
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseIncidentTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  return null;
}

/**
 * Calculate uptime statistics for services based on incidents
 * @param {Array} incidents - Array of incident objects
 * @param {Object} options - Configuration options
 * @param {number} options.windowDays - Number of days to look back (default: 90)
 * @param {Object} options.services - Service SLA configuration
 * @returns {Object} Service status object with uptime statistics
 */
export function calculateUptime(incidents, options = {}) {
  const {
    windowDays = 90,
    services = {
      delivery: 0.9999,
      publishing: 0.999,
    },
  } = options;

  const status = {};
  Object.entries(services).forEach(([service, sla]) => {
    status[service] = {
      sla,
      uptime: 1,
      numIncidents: 0,
      disruptionMins: 0,
    };
  });

  const windowMins = windowDays * 24 * 60;
  const windowMillis = windowMins * 60 * 1000;

  incidents
    .map((incident) => ({
      startTime: parseIncidentTimestamp(incident.startTime),
      endTime: parseIncidentTimestamp(incident.endTime),
      impactedService: incident.impactedService,
      errorRate: parseFloat(incident.errorRate) || 0,
    }))
    .filter(({
      startTime, endTime, impactedService, errorRate,
    }) => startTime && endTime && impactedService && errorRate)
    .filter(({ startTime }) => startTime > new Date(Date.now() - windowMillis))
    .forEach(({
      startTime, endTime, impactedService, errorRate,
    }) => {
      const disruptionMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      const downtimeMins = disruptionMins * errorRate;

      status[impactedService].totalDowntimeMins += downtimeMins;
      status[impactedService].numIncidents += 1;
    });

  // Calculate final uptime for each service based on accumulated downtime
  Object.entries(status).forEach(([, serviceStatus]) => {
    const uptimeMins = windowMins - serviceStatus.totalDowntimeMins;
    // eslint-disable-next-line no-param-reassign
    serviceStatus.uptime = uptimeMins / windowMins;

    // format uptime percentage to 2 decimal places
    // toFixed(2) rounds 99.99 up to 100.00, fall back to string slicing
    // eslint-disable-next-line no-param-reassign
    serviceStatus.uptimePercentage = `${(serviceStatus.uptime * 100)}`.slice(0, 6);
  });

  return status;
}

/**
 * Determine the status class based on uptime vs SLA
 * @param {number} uptime - Current uptime (0-1)
 * @param {number} sla - SLA target (0-1)
 * @returns {string} Status class: 'ok', 'warn', or 'err'
 */
export function getUptimeStatus(uptime, sla) {
  if (uptime >= sla) {
    return 'ok';
  }
  if (uptime >= sla - (1 - sla)) {
    return 'warn';
  }
  return 'err';
}

// Parse ISO 8601 timestamp
const parseTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return new Date(timestamp);
};

// Fetch incident data
const getIncidents = async () => {
    const response = await fetch('/incidents/index.json');
    const incidents = await response.json();
    return incidents;
};

// Calculate incidents per hour/day grid
const calculateHeatmapData = (incidents) => {
    const grid = {};
    const totalHours = {};

    // Initialize grid: 7 days x 24 hours
    for (let day = 0; day < 7; day++) {
        grid[day] = {};
        for (let hour = 0; hour < 24; hour++) {
            grid[day][hour] = 0;
            const key = `${day}-${hour}`;
            totalHours[key] = 0;
        }
    }

    // Count incidents by day of week and hour (UTC)
    incidents.forEach(incident => {
        // Use startTime when available, otherwise fall back to incidentUpdated
        const timestamp = incident.startTime || incident.incidentUpdated;
        const date = parseTimestamp(timestamp);
        if (!isNaN(date.getTime())) {
            const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
            const hour = date.getUTCHours();
            grid[dayOfWeek][hour]++;
        }
    });

    // Calculate total possible hours for each slot
    // (total number of that day/hour combination in the data range)
    const now = new Date();
    const oldestIncident = incidents.reduce((oldest, incident) => {
        // Use startTime when available, otherwise fall back to incidentUpdated
        const timestamp = incident.startTime || incident.incidentUpdated;
        const date = parseTimestamp(timestamp);
        return date < oldest ? date : oldest;
    }, now);

    const daysDiff = Math.floor((now - oldestIncident) / (1000 * 60 * 60 * 24));
    const weeksCount = Math.floor(daysDiff / 7);

    // Each day/hour slot appears approximately weeksCount times
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            totalHours[key] = weeksCount > 0 ? weeksCount : 1;
        }
    }

    // Calculate rate (incidents per time slot)
    const rates = {};
    for (let day = 0; day < 7; day++) {
        rates[day] = {};
        for (let hour = 0; hour < 24; hour++) {
            const key = `${day}-${hour}`;
            rates[day][hour] = grid[day][hour] / totalHours[key];
        }
    }

    return { grid, rates, totalHours, weeksCount };
};

// Get max value for color scaling
const getMaxRate = (rates) => {
    let max = 0;
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            if (rates[day][hour] > max) {
                max = rates[day][hour];
            }
        }
    }
    return max;
};

// Map rate to color level (0-10)
const getColorLevel = (rate, maxRate) => {
    if (rate === 0) return 0;
    const normalized = rate / maxRate;
    return Math.min(Math.ceil(normalized * 10), 10);
};

// Convert rate to human-readable frequency
const formatFrequency = (rate) => {
    if (rate === 0) {
        return 'Never happened';
    }

    const weeksPerOccurrence = 1 / rate;

    if (weeksPerOccurrence < 1) {
        // More than once per week
        const timesPerWeek = rate;
        if (timesPerWeek >= 2) {
            return `~${Math.round(timesPerWeek)} times per week`;
        } else {
            return 'About once per week';
        }
    } else if (weeksPerOccurrence < 4.33) {
        // Less than a month
        const weeks = Math.round(weeksPerOccurrence);
        return `Every ${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else if (weeksPerOccurrence < 52) {
        // Less than a year
        const months = Math.round(weeksPerOccurrence / 4.33);
        return `Every ${months} month${months !== 1 ? 's' : ''}`;
    } else {
        // More than a year
        const years = Math.round(weeksPerOccurrence / 52);
        if (years > 10) {
            return 'Very rarely (10+ years)';
        }
        return `Every ${years} year${years !== 1 ? 's' : ''}`;
    }
};

// Determine shift for a given UTC hour
// EU shift: 8:30 AM - 8:30 PM IST = 3:00 AM - 3:00 PM UTC (hours 3-14)
// US shift: 8:30 PM - 8:30 AM IST = 3:00 PM - 3:00 AM UTC (hours 15-23, 0-2)
const getShift = (hourUTC) => {
    if (hourUTC >= 3 && hourUTC <= 14) {
        return {
            name: 'EU',
            flags: ['🇨🇭', '🇫🇷', '🇩🇪'],
            countries: 'Switzerland, France, Germany'
        };
    } else {
        return {
            name: 'US',
            flags: ['🇺🇸', '🇨🇦'],
            countries: 'United States, Canada'
        };
    }
};

// Render heatmap
const renderHeatmap = (grid, rates) => {
    const container = document.getElementById('heatmap');
    const heatmap = document.createElement('div');
    heatmap.className = 'heatmap';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxRate = getMaxRate(rates);

    // Header row (hours)
    const headerRow = document.createElement('div');
    headerRow.className = 'heatmap-row';

    // Empty cell for top-left corner
    const cornerCell = document.createElement('div');
    cornerCell.className = 'heatmap-cell header';
    headerRow.appendChild(cornerCell);

    // Hour headers with shift indicators
    for (let hour = 0; hour < 24; hour++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell header';
        const shift = getShift(hour);
        const flagsHTML = shift.flags.map(flag => `<span class="flag">${flag}</span>`).join('');
        cell.innerHTML = `<div>${hour}</div><div class="shift-indicator ${shift.name.toLowerCase()}" title="${shift.name} shift: ${shift.countries}">${flagsHTML}</div>`;
        cell.title = `${hour}:00 UTC (${shift.name} shift: ${shift.countries})`;
        headerRow.appendChild(cell);
    }

    // Total column header
    const totalColHeader = document.createElement('div');
    totalColHeader.className = 'heatmap-cell header';
    totalColHeader.textContent = 'Total';
    totalColHeader.title = 'Total incidents for each day';
    headerRow.appendChild(totalColHeader);

    heatmap.appendChild(headerRow);

    // Data rows (days)
    for (let day = 0; day < 7; day++) {
        const row = document.createElement('div');
        row.className = 'heatmap-row';

        // Day label
        const labelCell = document.createElement('div');
        labelCell.className = 'heatmap-cell row-label';
        labelCell.textContent = days[day];
        row.appendChild(labelCell);

        // Hour cells
        for (let hour = 0; hour < 24; hour++) {
            const cell = document.createElement('div');
            const count = grid[day][hour];
            const rate = rates[day][hour];
            const level = getColorLevel(rate, maxRate);

            const shift = getShift(hour);
            const frequency = formatFrequency(rate);
            cell.className = `heatmap-cell data level-${level}`;
            cell.textContent = count;
            cell.dataset.day = days[day];
            cell.dataset.hour = hour;
            cell.dataset.count = count;
            cell.dataset.rate = rate.toFixed(3);
            cell.dataset.frequency = frequency;
            cell.dataset.shift = shift.name;
            cell.dataset.shiftCountries = shift.countries;

            // Tooltip on hover
            cell.addEventListener('mouseenter', (e) => {
                const tooltip = document.getElementById('tooltip');
                tooltip.innerHTML = `
                    <strong>${e.target.dataset.day} ${e.target.dataset.hour}:00 UTC</strong><br>
                    Shift: ${e.target.dataset.shift} (${e.target.dataset.shiftCountries})<br>
                    Incidents: ${e.target.dataset.count}<br>
                    Frequency: ${e.target.dataset.frequency}
                `;
                tooltip.classList.add('visible');
            });

            cell.addEventListener('mousemove', (e) => {
                const tooltip = document.getElementById('tooltip');
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            });

            cell.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('tooltip');
                tooltip.classList.remove('visible');
            });

            row.appendChild(cell);
        }

        // Row total (sum of all hours for this day)
        let dayTotal = 0;
        let dayTotalRate = 0;
        for (let hour = 0; hour < 24; hour++) {
            dayTotal += grid[day][hour];
            dayTotalRate += rates[day][hour];
        }
        const dayTotalCell = document.createElement('div');
        dayTotalCell.className = 'heatmap-cell summary';
        dayTotalCell.textContent = dayTotal;
        dayTotalCell.dataset.count = dayTotal;
        dayTotalCell.dataset.frequency = formatFrequency(dayTotalRate);
        dayTotalCell.title = `${days[day]}: ${dayTotal} total incidents (${formatFrequency(dayTotalRate)})`;

        dayTotalCell.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = `
                <strong>${days[day]} Total</strong><br>
                Incidents: ${e.target.dataset.count}<br>
                Frequency: ${e.target.dataset.frequency}
            `;
            tooltip.classList.add('visible');
        });

        dayTotalCell.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        });

        dayTotalCell.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            tooltip.classList.remove('visible');
        });

        row.appendChild(dayTotalCell);
        heatmap.appendChild(row);
    }

    // Summary row (totals for each hour across all days)
    const summaryRow = document.createElement('div');
    summaryRow.className = 'heatmap-row';

    // Label for summary row
    const summaryLabel = document.createElement('div');
    summaryLabel.className = 'heatmap-cell row-label';
    summaryLabel.textContent = 'Total';
    summaryRow.appendChild(summaryLabel);

    // Calculate totals for each hour
    let grandTotal = 0;
    let grandTotalRate = 0;
    for (let hour = 0; hour < 24; hour++) {
        let hourTotal = 0;
        let hourTotalRate = 0;
        for (let day = 0; day < 7; day++) {
            hourTotal += grid[day][hour];
            hourTotalRate += rates[day][hour];
        }
        grandTotal += hourTotal;
        grandTotalRate += hourTotalRate;

        const hourTotalCell = document.createElement('div');
        hourTotalCell.className = 'heatmap-cell summary';
        hourTotalCell.textContent = hourTotal;
        hourTotalCell.dataset.hour = hour;
        hourTotalCell.dataset.count = hourTotal;
        hourTotalCell.dataset.frequency = formatFrequency(hourTotalRate);
        hourTotalCell.title = `Hour ${hour}:00 UTC: ${hourTotal} total incidents (${formatFrequency(hourTotalRate)})`;

        hourTotalCell.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('tooltip');
            tooltip.innerHTML = `
                <strong>Hour ${e.target.dataset.hour}:00 UTC Total</strong><br>
                Incidents: ${e.target.dataset.count}<br>
                Frequency: ${e.target.dataset.frequency}
            `;
            tooltip.classList.add('visible');
        });

        hourTotalCell.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('tooltip');
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        });

        hourTotalCell.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('tooltip');
            tooltip.classList.remove('visible');
        });

        summaryRow.appendChild(hourTotalCell);
    }

    // Grand total (bottom-right corner)
    const grandTotalCell = document.createElement('div');
    grandTotalCell.className = 'heatmap-cell summary';
    grandTotalCell.textContent = grandTotal;
    grandTotalCell.title = `Grand total: ${grandTotal} incidents`;
    grandTotalCell.style.fontWeight = '800';
    grandTotalCell.style.backgroundColor = 'var(--spectrum-gray-200)';

    grandTotalCell.addEventListener('mouseenter', (e) => {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `
            <strong>Grand Total</strong><br>
            All incidents: ${grandTotal}
        `;
        tooltip.classList.add('visible');
    });

    grandTotalCell.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    });

    grandTotalCell.addEventListener('mouseleave', () => {
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.remove('visible');
    });

    summaryRow.appendChild(grandTotalCell);
    heatmap.appendChild(summaryRow);

    container.appendChild(heatmap);

    // Render legend
    const legendScale = document.getElementById('legend-scale');
    for (let i = 0; i <= 10; i++) {
        const box = document.createElement('div');
        box.className = `legend-box level-${i}`;
        legendScale.appendChild(box);
    }
};

// Calculate and render statistics
const renderStats = (grid, rates, incidents, weeksCount) => {
    const container = document.getElementById('stats');

    // Total incidents
    const totalIncidents = incidents.length;

    // Find busiest hour
    let busiestHour = { day: 0, hour: 0, count: 0 };
    let quietestHour = { day: 0, hour: 0, count: Infinity };

    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            if (grid[day][hour] > busiestHour.count) {
                busiestHour = { day, hour, count: grid[day][hour] };
            }
            if (grid[day][hour] < quietestHour.count) {
                quietestHour = { day, hour, count: grid[day][hour] };
            }
        }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate average incidents per week
    const avgPerWeek = (totalIncidents / weeksCount).toFixed(1);

    const stats = [
        {
            value: totalIncidents,
            label: 'Total Incidents'
        },
        {
            value: avgPerWeek,
            label: 'Avg Incidents/Week'
        },
        {
            value: `${days[busiestHour.day].slice(0, 3)} ${busiestHour.hour}:00`,
            label: `Busiest Time (${busiestHour.count} incidents)`
        },
        {
            value: `${days[quietestHour.day].slice(0, 3)} ${quietestHour.hour}:00`,
            label: `Quietest Time (${quietestHour.count} incidents)`
        }
    ];

    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        `;
        container.appendChild(card);
    });
};

// Initialize
const init = async () => {
    const incidents = await getIncidents();
    const { grid, rates, totalHours, weeksCount } = calculateHeatmapData(incidents);
    renderHeatmap(grid, rates);
    renderStats(grid, rates, incidents, weeksCount);

    // Set year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    document.body.classList.add('ready');
};

init();

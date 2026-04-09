const chartsContainer = document.getElementById('charts-container');
const dashboardTitle = document.getElementById('dashboard-title');

function fetchLatestCycle() {
    chartsContainer.innerHTML = '<p style="font-size: 20px; text-align: center;">Loading latest cycle...</p>';
    dashboardTitle.innerText = "Latest Cycle - STRESS RELIEVING FURNACE (SRF-01)";
    
    fetch('/api/latest_cycle')
        .then(response => response.json())
        .then(data => {
            chartsContainer.innerHTML = '';
            if(data.length === 0) {
                chartsContainer.innerHTML = '<p style="text-align: center;">No data found.</p>';
                return;
            }
            renderCycleGraph(data, 'Latest Completed Cycle');
        })
        .catch(err => console.error(err));
}

function fetchDateRange() {
    const start = document.getElementById('start-date').value;
    const end = document.getElementById('end-date').value;

    if (!start || !end) {
        alert("Please select both Start and End dates from the dropdowns.");
        return;
    }

    chartsContainer.innerHTML = '<p style="font-size: 20px; text-align: center;">Loading records and generating graphs...</p>';
    dashboardTitle.innerText = `Records from ${start} to ${end} - SRF-01`;

    fetch('/api/date_range', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end })
    })
    .then(response => response.json())
    .then(data => {
        chartsContainer.innerHTML = '';
        if(data.length === 0) {
            chartsContainer.innerHTML = '<p style="text-align: center;">No data found in this date range.</p>';
            return;
        }
        processMultipleCycles(data);
    })
    .catch(err => console.error(err));
}

function processMultipleCycles(data) {
    let cyclesArray = [];
    let currentCycleData = [];
    let cycleCount = 1;

    data.forEach(row => {
        if (row.Cycle_end === 1 || row.Cycle_end === true) {
            // MARKER DETECTED: Cut off the cycle here. DO NOT push this row into the graph.
            if (currentCycleData.length > 0) {
                cyclesArray.push({ data: currentCycleData, title: `Cycle ${cycleCount}` });
                cycleCount++;
            }
            // Start completely fresh so the marker point is thrown away
            currentCycleData = []; 
        } else {
            // Normal data point: add it to the graph
            currentCycleData.push(row);
        }
    });

    if (currentCycleData.length > 0) {
        cyclesArray.push({ data: currentCycleData, title: `Cycle ${cycleCount} (Ongoing)` });
    }

    cyclesArray.reverse();

    cyclesArray.forEach(cycle => {
        renderCycleGraph(cycle.data, cycle.title);
    });
}

function renderCycleGraph(cycleData, cycleTitle) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'chart-wrapper';
    
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-box';
    const chartId = 'chart-' + Math.random().toString(36).substr(2, 9);
    chartDiv.id = chartId;
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'action-buttons';
    
    const pdfBtn = document.createElement('button');
    pdfBtn.className = 'export-btn pdf-btn';
    pdfBtn.innerText = '📄 Download High-Def PDF';
    pdfBtn.onclick = () => exportToPDF(chartId, cycleTitle, pdfBtn);

    const htmlBtn = document.createElement('button');
    htmlBtn.className = 'export-btn html-btn';
    htmlBtn.innerText = '📊 Download Interactive Report';

    btnContainer.appendChild(pdfBtn);
    btnContainer.appendChild(htmlBtn);

    wrapperDiv.appendChild(chartDiv);
    wrapperDiv.appendChild(btnContainer);
    chartsContainer.appendChild(wrapperDiv);

    const rawTime = cycleData.map(d => d.log_time); 
    const time = [];
    const timeCounts = {};
    const timeTracker = {};

    rawTime.forEach(t => {
        timeCounts[t] = (timeCounts[t] || 0) + 1;
    });

    rawTime.forEach(t => {
        if(timeTracker[t] === undefined) { timeTracker[t] = 0; }
        
        let totalPoints = timeCounts[t];
        let msOffset = totalPoints > 1 ? Math.floor((timeTracker[t] / totalPoints) * 1000) : 0;
        let msString = msOffset.toString().padStart(3, '0');
        
        time.push(`${t.replace(' ', 'T')}.${msString}`);
        timeTracker[t]++;
    });

    const h1 = cycleData.map(d => d.heater1_pv);
    const h2 = cycleData.map(d => d.heater2_pv);
    const h3 = cycleData.map(d => d.heater3_pv);
    
    let filteredTicks = [];
    let maxLabelsAllowed = 35;
    
    if (time.length <= maxLabelsAllowed) {
        filteredTicks = [...time];
    } else {
        let firstTimeMs = new Date(time[0]).getTime();
        let lastTimeMs = new Date(time[time.length - 1]).getTime();
        let totalDurationMs = lastTimeMs - firstTimeMs;
        
        let dynamicGapMs = Math.max(14000, totalDurationMs / maxLabelsAllowed);
        let lastTimestamp = 0;
        
        time.forEach(t => {
            let currentTimestamp = new Date(t).getTime(); 
            if (currentTimestamp - lastTimestamp >= dynamicGapMs) {
                filteredTicks.push(t);
                lastTimestamp = currentTimestamp;
            }
        });
        
        if (filteredTicks[0] !== time[0]) filteredTicks.unshift(time[0]);
        if (filteredTicks[filteredTicks.length - 1] !== time[time.length - 1]) filteredTicks.push(time[time.length - 1]);
    }
    
    let timeOnlyLabels = filteredTicks.map(t => {
        let timePart = t.split('T')[1];
        return timePart.split('.')[0]; 
    });

    const trace1 = { x: time, y: h1, type: 'scatter', mode: 'lines+markers', name: 'CH-1', line: {width: 2}, marker: {size: 3} };
    const trace2 = { x: time, y: h2, type: 'scatter', mode: 'lines+markers', name: 'CH-2', line: {width: 2}, marker: {size: 3} };
    const trace3 = { x: time, y: h3, type: 'scatter', mode: 'lines+markers', name: 'CH-3', line: {width: 2}, marker: {size: 3} };

    const layout = {
        font: { family: 'Arial, sans-serif' }, 
        title: {
            text: `<b>STRESS RELEVING FURNACE (SRF-01)</b><br><span style="font-size:16px">${cycleTitle}</span><br><span style="font-size:14px; font-weight:normal; color:#333;"><b>Start:</b> ${rawTime[0]}    |    <b>End:</b> ${rawTime[rawTime.length - 1]}</span>`,
            font: { size: 20, color: 'black' },
            y: 0.96
        },
        xaxis: { 
            title: '<b>TIME</b>', 
            tickangle: -90, 
            tickmode: 'array', 
            tickvals: filteredTicks,    
            ticktext: timeOnlyLabels,   
            automargin: true,  
            showline: true, linewidth: 2, linecolor: 'black', mirror: true, 
            showgrid: true, gridcolor: '#d3d3d3',
            tickfont: { size: 14 }
        },
        yaxis: { 
            title: '<b>TEMPERATURE (°C)</b>', 
            showline: true, linewidth: 2, linecolor: 'black', mirror: true, 
            showgrid: true, gridcolor: '#d3d3d3',
            zeroline: false,
            range: [0, 800], 
            dtick: 50,
            tickfont: { size: 14 }
        },
        legend: { 
            x: 1.02, y: 1, 
            bordercolor: 'black', borderwidth: 1,
            font: { size: 14 }
        },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        margin: { l: 80, r: 120, t: 140, b: 100 }, 
        hovermode: 'x unified' 
    };
    
    const tracesJSON = JSON.stringify([trace1, trace2, trace3]);
    const layoutJSON = JSON.stringify(layout);
    
    htmlBtn.onclick = () => exportToInteractiveHTML(tracesJSON, layoutJSON, cycleTitle, rawTime[0], rawTime[rawTime.length - 1]);

    Plotly.newPlot(chartId, [trace1, trace2, trace3], layout, {responsive: true, displaylogo: false});
}

function exportToPDF(chartId, cycleTitle, btnElement) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    const originalText = btnElement.innerText;
    btnElement.innerText = "Generating HD PDF...";
    btnElement.disabled = true;

    const chartDiv = document.getElementById(chartId);
    
    // Capture the exact real-world dimensions of the element
    const w = chartDiv.clientWidth;
    const h = chartDiv.clientHeight;
    
    // HIGH DEFINITION FIX: Keep proportions exact, but multiply pixel density by 4.
    // This stops Plotly from stretching the canvas and ruining font visibility.
    Plotly.toImage(chartId, {format: 'png', width: w, height: h, scale: 4})
        .then(function(dataUrl) {
            const pdfWidth = 277; 
            const pdfHeight = (h / w) * pdfWidth;
            const yOffset = (210 - pdfHeight) / 2;

            doc.addImage(dataUrl, 'PNG', 10, yOffset, pdfWidth, pdfHeight);
            
            let safeTitle = cycleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`SRF-01_HD_Report_${safeTitle}.pdf`);
            
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        })
        .catch(function(err) {
            console.error('Error generating PDF:', err);
            alert('Failed to generate PDF. Check console for details.');
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        });
}

function exportToInteractiveHTML(tracesStr, layoutStr, cycleTitle, startTime, endTime) {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${cycleTitle} - Interactive Report</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f9; }
        .report-header { text-align: center; margin-bottom: 20px; color: #2c3e50; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); height: 80vh; }
        #plot { width: 100%; height: 100%; }
        .instructions { text-align: center; margin-top: 15px; color: #7f8c8d; font-size: 14px; }
        .time-labels { font-size: 14px; color: #555; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="report-header">
        <h2>Interactive Thermal Mapping Report</h2>
        <p><strong>${cycleTitle}</strong></p>
        <p class="time-labels"><strong>Start:</strong> ${startTime} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>End:</strong> ${endTime}</p>
    </div>
    
    <div class="chart-container">
        <div id="plot"></div>
    </div>
    
    <p class="instructions">
        <strong>Tip:</strong> Hover over the graph to see exact values. Click on a channel name in the legend on the right to toggle it ON/OFF.
    </p>

    <script>
        const traces = ${tracesStr};
        const layout = ${layoutStr};
        
        layout.title = '';
        
        Plotly.newPlot('plot', traces, layout, {responsive: true, displaylogo: false});
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    
    let safeTitle = cycleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadLink.download = `SRF-01_Interactive_${safeTitle}.html`;
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

window.onload = fetchLatestCycle;

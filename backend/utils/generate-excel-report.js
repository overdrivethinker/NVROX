const ExcelJS = require("exceljs");

async function generateSensorReport(
    sensorData,
    alertData,
    thresholdData,
    startDate,
    endDate,
) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Sensor Monitoring System";
    wb.created = new Date();

    const thrByMac = Object.fromEntries(
        thresholdData.map((d) => [d.mac_address, d]),
    );

    // ── style helpers ──────────────────────────────────────────────────────────
    const rgb = (hex) => ({ argb: "FF" + hex.replace("#", "") });

    const hdrStyle = (bgHex = "1F3864") => ({
        font: { bold: true, color: rgb("FFFFFF"), size: 10, name: "Arial" },
        fill: { type: "pattern", pattern: "solid", fgColor: rgb(bgHex) },
        alignment: { horizontal: "center", vertical: "middle", wrapText: true },
        border: border(),
    });

    const cellStyle = (bgHex, fgHex = "000000", bold = false) => ({
        font: { bold, color: rgb(fgHex), size: 10, name: "Arial" },
        fill: bgHex
            ? { type: "pattern", pattern: "solid", fgColor: rgb(bgHex) }
            : { type: "pattern", pattern: "none" },
        alignment: { vertical: "middle" },
        border: border(),
    });

    const centerStyle = (bgHex, fgHex = "000000", bold = false) => ({
        ...cellStyle(bgHex, fgHex, bold),
        alignment: { horizontal: "center", vertical: "middle" },
    });

    function border() {
        const s = { style: "thin", color: { argb: "FFD0D0D0" } };
        return { top: s, left: s, bottom: s, right: s };
    }

    function formatDate(str) {
        if (!str) return "-";
        const s = str.replace("T", " ").replace("Z", "").split(".")[0];
        const [datePart, time] = s.split(" ");
        if (!datePart || !time) return s;
        const [y, m, d] = datePart.split("-");
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        return `${d} ${months[+m - 1]} ${y}, ${time}`;
    }

    const avg = (arr) =>
        arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // ── aggregation ─────────────────────────────────────────────────────────────
    const temps = sensorData.map((r) => parseFloat(r.temperature));
    const humids = sensorData.map((r) => parseFloat(r.humidity));

    const locStats = {};
    for (const r of sensorData) {
        if (!locStats[r.location])
            locStats[r.location] = { temps: [], humids: [], alerts: 0 };
        locStats[r.location].temps.push(parseFloat(r.temperature));
        locStats[r.location].humids.push(parseFloat(r.humidity));
    }
    for (const a of alertData) {
        if (locStats[a.location]) locStats[a.location].alerts++;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 1 – DASHBOARD
    // ═══════════════════════════════════════════════════════════════════════════
    const wsDash = wb.addWorksheet("Dashboard", {
        views: [{ showGridLines: false }],
        properties: { tabColor: { argb: "FF1F3864" } },
    });

    // Title
    wsDash.mergeCells("A1:N2");
    Object.assign(wsDash.getCell("A1"), {
        value: `🌡️  SENSOR MONITORING DASHBOARD  —  ${startDate}  to  ${endDate}`,
        style: {
            font: { bold: true, size: 16, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("1F3864") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsDash.getRow(1).height = 32;
    wsDash.getRow(2).height = 8;

    // KPI cards (rows 3–7)
    const kpis = [
        {
            label: "Total Readings",
            value: sensorData.length,
            color: "2E75B6",
            icon: "📋",
            sc: 1,
        },
        {
            label: "Avg Temperature",
            value: `${avg(temps).toFixed(1)} °C`,
            color: "C55A11",
            icon: "🌡️",
            sc: 5,
        },
        {
            label: "Avg Humidity",
            value: `${avg(humids).toFixed(1)} %`,
            color: "375623",
            icon: "💧",
            sc: 9,
        },
        {
            label: "Total Alerts",
            value: alertData.length,
            color: "C00000",
            icon: "🚨",
            sc: 13,
        },
    ];

    for (const kpi of kpis) {
        const ec = kpi.sc + 2;
        wsDash.mergeCells(3, kpi.sc, 3, ec);
        Object.assign(wsDash.getCell(3, kpi.sc), {
            value: `${kpi.icon}  ${kpi.label}`,
            style: {
                font: {
                    bold: true,
                    size: 10,
                    color: rgb("FFFFFF"),
                    name: "Arial",
                },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: rgb(kpi.color),
                },
                alignment: { horizontal: "center", vertical: "middle" },
            },
        });
        wsDash.mergeCells(4, kpi.sc, 7, ec);
        Object.assign(wsDash.getCell(4, kpi.sc), {
            value: kpi.value,
            style: {
                font: {
                    bold: true,
                    size: 20,
                    color: rgb(kpi.color),
                    name: "Arial",
                },
                fill: {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: rgb("F4F4F4"),
                },
                alignment: { horizontal: "center", vertical: "middle" },
            },
        });
    }
    for (let r = 3; r <= 7; r++) wsDash.getRow(r).height = 18;

    // Section header
    wsDash.getRow(8).height = 8;
    wsDash.mergeCells("A9:J9");
    Object.assign(wsDash.getCell("A9"), {
        value: "📍  SUMMARY PER LOCATION",
        style: {
            font: { bold: true, size: 12, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("1F3864") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsDash.getRow(9).height = 22;

    const summaryHeaders = [
        ["Location", 20],
        ["Readings", 10],
        ["Avg Temp (°C)", 14],
        ["Min Temp", 10],
        ["Max Temp", 10],
        ["Avg Humid (%)", 14],
        ["Min Humid", 10],
        ["Max Humid", 10],
        ["Alerts", 8],
        ["Status", 14],
    ];
    summaryHeaders.forEach(([h, w], i) => {
        wsDash.getColumn(i + 1).width = w;
        Object.assign(wsDash.getCell(10, i + 1), {
            value: h,
            style: hdrStyle("2E75B6"),
        });
    });
    wsDash.getRow(10).height = 28;

    let dr = 11;
    for (const [loc, stats] of Object.entries(locStats).sort()) {
        const { temps: t, humids: h, alerts } = stats;
        const hasAlert = alerts > 0;
        const rowBg = hasAlert ? "FFF2CC" : "E2EFDA";
        const row = [
            loc,
            t.length,
            +avg(t).toFixed(1),
            +Math.min(...t).toFixed(1),
            +Math.max(...t).toFixed(1),
            +avg(h).toFixed(1),
            +Math.min(...h).toFixed(1),
            +Math.max(...h).toFixed(1),
            alerts,
            hasAlert ? "⚠️ Check" : "✅ OK",
        ];
        row.forEach((v, ci) => {
            const cell = wsDash.getCell(dr, ci + 1);
            cell.value = v;
            if (ci === 9)
                Object.assign(
                    cell,
                    centerStyle(rowBg, hasAlert ? "C00000" : "375623", true),
                );
            else if (ci === 0) Object.assign(cell, cellStyle(rowBg));
            else Object.assign(cell, centerStyle(null));
        });
        wsDash.getRow(dr).height = 18;
        dr++;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 2 – RAW DATA
    // ═══════════════════════════════════════════════════════════════════════════
    const wsRaw = wb.addWorksheet("Raw Data", {
        views: [{ showGridLines: false, state: "frozen", ySplit: 2 }],
        properties: { tabColor: { argb: "FF2E75B6" } },
    });

    wsRaw.mergeCells("A1:F1");
    Object.assign(wsRaw.getCell("A1"), {
        value: `Raw Sensor Data  |  ${startDate} – ${endDate}  |  ${sensorData.length.toLocaleString()} records`,
        style: {
            font: { bold: true, size: 13, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("1F3864") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsRaw.getRow(1).height = 26;

    [
        ["Recorded At", 22],
        ["Device Name", 22],
        ["Location", 18],
        ["MAC Address", 20],
        ["Temperature (°C)", 16],
        ["Humidity (%)", 14],
    ].forEach(([h, w], i) => {
        wsRaw.getColumn(i + 1).width = w;
        Object.assign(wsRaw.getCell(2, i + 1), {
            value: h,
            style: hdrStyle("2E75B6"),
        });
    });
    wsRaw.getRow(2).height = 28;

    sensorData.forEach((row, idx) => {
        const r = idx + 3;
        const temp = parseFloat(row.temperature);
        const humid = parseFloat(row.humidity);
        const thr = thrByMac[row.mac_address] || {};
        const tempAlert =
            thr.tempMax != null && (temp > thr.tempMax || temp < thr.tempMin);
        const humidAlert =
            thr.humidMax != null &&
            (humid > thr.humidMax || humid < thr.humidMin);
        const rowBg = tempAlert || humidAlert ? "FFF2CC" : null;

        const cols = [
            [formatDate(row.recorded_at), cellStyle(rowBg)],
            [row.device_name, cellStyle(rowBg)],
            [row.location, cellStyle(rowBg)],
            [row.mac_address, cellStyle(rowBg)],
            [
                temp,
                tempAlert
                    ? centerStyle("FFCCCC", "C00000", true)
                    : centerStyle(rowBg),
            ],
            [
                humid,
                humidAlert
                    ? centerStyle("FFCCCC", "C00000", true)
                    : centerStyle(rowBg),
            ],
        ];
        cols.forEach(([val, style], ci) => {
            const cell = wsRaw.getCell(r, ci + 1);
            cell.value = val;
            if (ci >= 4) cell.numFmt = "0.0";
            Object.assign(cell, style);
        });
        wsRaw.getRow(r).height = 16;
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 3 – ALERTS
    // ═══════════════════════════════════════════════════════════════════════════
    const wsAlert = wb.addWorksheet("Alerts", {
        views: [{ showGridLines: false, state: "frozen", ySplit: 2 }],
        properties: { tabColor: { argb: "FFC00000" } },
    });

    wsAlert.mergeCells("A1:H1");
    Object.assign(wsAlert.getCell("A1"), {
        value: `Alert Log  |  ${startDate} – ${endDate}  |  ${alertData.length.toLocaleString()} alerts`,
        style: {
            font: { bold: true, size: 13, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("C00000") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsAlert.getRow(1).height = 26;

    [
        ["Recorded At", 22],
        ["Device Name", 22],
        ["Location", 18],
        ["MAC Address", 20],
        ["Parameter", 14],
        ["Threshold", 12],
        ["Value", 12],
        ["Status", 16],
    ].forEach(([h, w], i) => {
        wsAlert.getColumn(i + 1).width = w;
        Object.assign(wsAlert.getCell(2, i + 1), {
            value: h,
            style: hdrStyle("C00000"),
        });
    });
    wsAlert.getRow(2).height = 28;

    alertData.forEach((row, idx) => {
        const r = idx + 3;
        const unit = row.parameter === "Temperature" ? "°C" : "%";
        const over = row.status === "Over Limit";
        const bg = over ? "FFCCCC" : "FFE5B4";
        [
            [formatDate(row.recorded_at), cellStyle(null)],
            [row.device_name, cellStyle(null)],
            [row.location, cellStyle(null)],
            [row.mac_address, cellStyle(null)],
            [row.parameter, centerStyle(null)],
            [`${row.threshold}${unit}`, centerStyle(null)],
            [`${row.value}${unit}`, centerStyle(bg, "C00000", true)],
            [
                over ? "🔴 Over Limit" : "🔵 Under Limit",
                centerStyle(bg, over ? "C00000" : "1F3864", true),
            ],
        ].forEach(([val, style], ci) => {
            Object.assign(wsAlert.getCell(r, ci + 1), { value: val, style });
        });
        wsAlert.getRow(r).height = 16;
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 4 – TRENDS (hourly pivot table — siap dibuat chart di Excel)
    // ═══════════════════════════════════════════════════════════════════════════
    const wsTrend = wb.addWorksheet("Trends", {
        views: [{ showGridLines: false }],
        properties: { tabColor: { argb: "FF375623" } },
    });

    wsTrend.mergeCells("A1:E1");
    Object.assign(wsTrend.getCell("A1"), {
        value: "Hourly Average — Temperature & Humidity (All Sensors)",
        style: {
            font: { bold: true, size: 13, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("1F3864") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsTrend.getRow(1).height = 26;

    wsTrend.mergeCells("A2:E2");
    Object.assign(wsDash.getCell("A2") || wsTrend.getCell("A2"), {});
    wsTrend.getCell("A2").value =
        "💡 Tip: Pilih kolom B–D lalu Insert → Chart (Line) untuk visualisasi grafik";
    wsTrend.getCell("A2").style = {
        font: { italic: true, size: 9, color: rgb("595959"), name: "Arial" },
        alignment: { horizontal: "left", vertical: "middle" },
    };
    wsTrend.getRow(2).height = 16;

    // Hourly pivot
    const hourData = {};
    for (const r of sensorData) {
        const hour = r.recorded_at.slice(11, 13) + ":00";
        if (!hourData[hour]) hourData[hour] = { temps: [], humids: [] };
        hourData[hour].temps.push(parseFloat(r.temperature));
        hourData[hour].humids.push(parseFloat(r.humidity));
    }

    [
        ["Hour", 10],
        ["Avg Temp (°C)", 16],
        ["Min Temp", 12],
        ["Max Temp", 12],
        ["Avg Humid (%)", 16],
    ].forEach(([h, w], i) => {
        wsTrend.getColumn(i + 1).width = w;
        Object.assign(wsTrend.getCell(3, i + 1), {
            value: h,
            style: hdrStyle("2E75B6"),
        });
    });
    wsTrend.getRow(3).height = 26;

    Object.keys(hourData)
        .sort()
        .forEach((hour, idx) => {
            const r = idx + 4;
            const d = hourData[hour];
            const avgT = +avg(d.temps).toFixed(1);
            const minT = +Math.min(...d.temps).toFixed(1);
            const maxT = +Math.max(...d.temps).toFixed(1);
            const avgH = +avg(d.humids).toFixed(1);

            [hour, avgT, minT, maxT, avgH].forEach((v, ci) => {
                Object.assign(wsTrend.getCell(r, ci + 1), {
                    value: v,
                    style: centerStyle(null),
                });
            });
            wsTrend.getRow(r).height = 16;
        });

    // Per-location daily pivot
    const locLen = Object.keys(hourData).length;
    const pivotStartRow = locLen + 6;

    wsTrend.mergeCells(pivotStartRow, 1, pivotStartRow, 5);
    Object.assign(wsTrend.getCell(pivotStartRow, 1), {
        value: "Daily Summary per Location",
        style: {
            font: { bold: true, size: 11, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("1F3864") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsTrend.getRow(pivotStartRow).height = 22;

    [
        ["Location", 20],
        ["Avg Temp (°C)", 16],
        ["Avg Humid (%)", 16],
        ["Alerts", 10],
        ["Status", 14],
    ].forEach(([h, w], i) => {
        wsTrend.getColumn(i + 1).width = Math.max(
            wsTrend.getColumn(i + 1).width || 0,
            w,
        );
        Object.assign(wsTrend.getCell(pivotStartRow + 1, i + 1), {
            value: h,
            style: hdrStyle("2E75B6"),
        });
    });

    let pr = pivotStartRow + 2;
    for (const [loc, stats] of Object.entries(locStats).sort()) {
        const hasAlert = stats.alerts > 0;
        [
            [loc, cellStyle(hasAlert ? "FFF2CC" : "E2EFDA")],
            [+avg(stats.temps).toFixed(1), centerStyle(null)],
            [+avg(stats.humids).toFixed(1), centerStyle(null)],
            [
                stats.alerts,
                centerStyle(null, hasAlert ? "C00000" : "000000", hasAlert),
            ],
            [
                hasAlert ? "⚠️ Check" : "✅ OK",
                centerStyle(null, hasAlert ? "C00000" : "375623", true),
            ],
        ].forEach(([v, s], ci) => {
            Object.assign(wsTrend.getCell(pr, ci + 1), { value: v, style: s });
        });
        wsTrend.getRow(pr).height = 16;
        pr++;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHEET 5 – THRESHOLDS
    // ═══════════════════════════════════════════════════════════════════════════
    const wsCfg = wb.addWorksheet("Thresholds", {
        views: [{ showGridLines: false }],
        properties: { tabColor: { argb: "FF7F7F7F" } },
    });

    wsCfg.mergeCells("A1:H1");
    Object.assign(wsCfg.getCell("A1"), {
        value: "Device Threshold Configuration",
        style: {
            font: { bold: true, size: 13, color: rgb("FFFFFF"), name: "Arial" },
            fill: { type: "pattern", pattern: "solid", fgColor: rgb("1F3864") },
            alignment: { horizontal: "center", vertical: "middle" },
        },
    });
    wsCfg.getRow(1).height = 26;

    wsCfg.mergeCells("A2:H2");
    wsCfg.getCell("A2").value =
        "ℹ️  Values pulled from API. Edit thresholds in the system, then re-export.";
    wsCfg.getCell("A2").style = {
        font: { size: 9, color: rgb("595959"), name: "Arial" },
    };
    wsCfg.getRow(2).height = 18;

    [
        ["Device Name", 24],
        ["Location", 18],
        ["MAC Address", 20],
        ["Status", 10],
        ["Temp Min (°C)", 14],
        ["Temp Max (°C)", 14],
        ["Humid Min (%)", 14],
        ["Humid Max (%)", 14],
    ].forEach(([h, w], i) => {
        wsCfg.getColumn(i + 1).width = w;
        Object.assign(wsCfg.getCell(3, i + 1), {
            value: h,
            style: hdrStyle("2E75B6"),
        });
    });
    wsCfg.getRow(3).height = 28;

    thresholdData.forEach((d, idx) => {
        const r = idx + 4;
        const isActive = (d.status || "active") === "active";
        [
            [d.device_name, cellStyle(null)],
            [d.location, cellStyle(null)],
            [d.mac_address, cellStyle(null)],
            [
                (d.status || "active").toUpperCase(),
                centerStyle(null, isActive ? "375623" : "595959", true),
            ],
            [d.tempMin ?? "-", centerStyle(null)],
            [d.tempMax ?? "-", centerStyle(null)],
            [d.humidMin ?? "-", centerStyle(null)],
            [d.humidMax ?? "-", centerStyle(null)],
        ].forEach(([v, s], ci) => {
            Object.assign(wsCfg.getCell(r, ci + 1), { value: v, style: s });
        });
        wsCfg.getRow(r).height = 16;
    });

    return wb;
}

module.exports = { generateSensorReport };

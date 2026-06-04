function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(" ");
}

function formatTimestamp(date = new Date()) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function toWIB(date) {
    const wib = new Date(date);
    wib.setHours(wib.getHours() + 7);
    return wib;
}

function validateField(value, fieldName, res) {
    if (!value || value.trim() === "") {
        return res.status(400).json({
            success: false,
            error: `${fieldName} cannot be empty`,
        });
    }
    return null;
}

module.exports = {
    formatUptime,
    formatTimestamp,
    validateField,
    toWIB,
};

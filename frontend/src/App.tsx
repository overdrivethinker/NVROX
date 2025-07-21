import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Overview from "@/app/dashboard/overview";
import AlertWarning from "./app/dashboard/alert-warning";
import LiveMonitoring from "./app/environment/live-monitoring";
import Historical from "./app/environment/historical";
import MonthlyReport from "./app/environment/monthly-reports";
import DeviceSetup from "@/app/configuration/device-setup";
import UserAccess from "./app/configuration/user-acccess";
import { Toaster } from "@/components/ui/sonner";

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Toaster position="top-center" />
            <Routes>
                <Route path="/" element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="alert-warning" element={<AlertWarning />} />
                <Route path="live-monitoring" element={<LiveMonitoring />} />
                <Route path="historical-logs" element={<Historical />} />
                <Route path="monthly-reports" element={<MonthlyReport />} />
                <Route path="device-setup" element={<DeviceSetup />} />
                <Route path="user-access" element={<UserAccess />} />
            </Routes>
        </ThemeProvider>
    );
}

export default App;

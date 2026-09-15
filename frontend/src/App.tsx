import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import DeviceMonitoring from "@/app/monitoring/sensor-grid";
import Alerts from "./app/alerts/threshold-alerts";
import LiveMonitoring from "./app/monitoring/device-detail";
import Historical from "./app/analytics/historical";
import DeviceTrends from "./app/analytics/device-trends";
import DeviceSetup from "@/app/configuration/device-setup";
import UserAccess from "./app/configuration/user-acccess";
import LoginPage from "./app/login/page";
import Overview from "./app/overview/heatmap";
import FactoryLayout from "./app/overview/factory-layout";
import { Toaster } from "@/components/ui/sonner";

import type { ReactElement } from "react";

function ProtectedRoute({
    children,
}: {
    children: ReactElement;
}): ReactElement {
    const user = sessionStorage.getItem("user");
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function PublicRoute({ children }: { children: ReactElement }): ReactElement {
    const user = sessionStorage.getItem("user");
    if (user) {
        return <Navigate to="/factory-layout" replace />;
    }
    return children;
}

function RootRedirect(): ReactElement {
    const user = sessionStorage.getItem("user");
    return user ? (
        <Navigate to="/factory-layout" replace />
    ) : (
        <Navigate to="/login" replace />
    );
}

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Toaster position="top-center" />
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route
                    path="login"
                    element={
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    }
                />
                <Route
                    path="heatmap"
                    element={
                        <ProtectedRoute>
                            <Overview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="sensor-grid"
                    element={
                        <ProtectedRoute>
                            <DeviceMonitoring />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="factory-layout"
                    element={
                        <ProtectedRoute>
                            <FactoryLayout />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="threshold-alerts"
                    element={
                        <ProtectedRoute>
                            <Alerts />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="device-detail"
                    element={
                        <ProtectedRoute>
                            <LiveMonitoring />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="historical-logs"
                    element={
                        <ProtectedRoute>
                            <Historical />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="device-trends"
                    element={
                        <ProtectedRoute>
                            <DeviceTrends />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="device-setup"
                    element={
                        <ProtectedRoute>
                            <DeviceSetup />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="user-access"
                    element={
                        <ProtectedRoute>
                            <UserAccess />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </ThemeProvider>
    );
}

export default App;

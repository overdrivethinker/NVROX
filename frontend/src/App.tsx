import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Overview from "@/app/dashboard/overview";
import Alerts from "./app/dashboard/alerts";
import LiveMonitoring from "./app/environment/live-monitoring";
import Historical from "./app/environment/historical";
import RecentCondition from "./app/environment/recent-condition";
import DeviceSetup from "@/app/configuration/device-setup";
import UserAccess from "./app/configuration/user-acccess";
import LoginPage from "./app/login/page";
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
        return <Navigate to="/overview" replace />;
    }
    return children;
}

function RootRedirect(): ReactElement {
    const user = sessionStorage.getItem("user");
    return user ? (
        <Navigate to="/overview" replace />
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
                    path="overview"
                    element={
                        <ProtectedRoute>
                            <Overview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="alerts"
                    element={
                        <ProtectedRoute>
                            <Alerts />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="live-monitoring"
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
                    path="recent-condition"
                    element={
                        <ProtectedRoute>
                            <RecentCondition />
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

export function useAuth() {
    const userStr = sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    return {
        user,
        isAdmin: user?.role === "Admin",
        isLoggedIn: !!user,
    };
}

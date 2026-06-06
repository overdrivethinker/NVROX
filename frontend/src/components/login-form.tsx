import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useNavigate } from "react-router-dom";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { Separator } from "@/components/ui/separator";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username,
                password,
            });

            sessionStorage.setItem("user", JSON.stringify(response.data.user));
            sessionStorage.setItem("isLoggedIn", "true");

            toast.success("Login successful");
            navigate("/overview");
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                console.error("Login error:", err);
                const message =
                    err.response?.data?.error ||
                    "Invalid username or password.";
                setError(message);
                toast.error(message);
            } else {
                console.error("Unexpected error:", err);
                setError("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleLogin}
            className={cn("flex flex-col gap-6", className)}
            {...props}
        >
            <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                        Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your credentials to continue
                    </p>
                </div>
                <Field>
                    <FieldLabel>Username</FieldLabel>
                    <Input
                        id="username"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel>Password</FieldLabel>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Field>
                <Field>
                    {error && (
                        <p className="text-sm text-red-500 text-center">
                            {error}
                        </p>
                    )}
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                    <div className="relative py-4">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                            OR
                        </span>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            sessionStorage.setItem(
                                "user",
                                JSON.stringify({
                                    username: "Guest",
                                    role: "User",
                                }),
                            );
                            navigate("/overview");
                        }}
                    >
                        Continue as Guest
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    );
}

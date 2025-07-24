import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const handleLogin = () => {
        navigate("/overview");
    };
    return (
        <form className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                    Enter your credentials to continue
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="Username"
                        required
                    />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-2 text-muted-foreground">
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
                <Button type="submit" onClick={handleLogin} className="w-full">
                    Login
                </Button>
            </div>
            <footer className="text-center text-sm text-muted-foreground pb-6">
                <p>© {new Date().getFullYear()} NVROX. All rights reserved.</p>
            </footer>
        </form>
    );
}

import { IconBackground } from "@tabler/icons-react";
import { LoginForm } from "@/components/login-form";
import background from "@/assets/background.jpg";
import { ModeToggle } from "@/components/mode-toggle";
export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <IconBackground className="size-6" />
                        <span className="text-base font-bold">NVROX</span>
                        <span className="text-xs text-muted-foreground">
                            /ˈɛn.vaɪ.rɒks/
                        </span>
                    </a>
                    <ModeToggle />
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <LoginForm />
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block ">
                <img
                    src={background}
                    alt="Background"
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.4] dark:grayscale"
                />
            </div>
        </div>
    );
}

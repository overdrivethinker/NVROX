import { LoginForm } from "@/components/login-form";
import { ModeToggle } from "@/components/mode-toggle";
import { IconBoxAlignRight } from "@tabler/icons-react";
import { AboutButton } from "@/components/about-button";
import background from "@/assets/background.jpg";
import { Separator } from "@/components/ui/separator";
import { useRef } from "react";

export default function LoginPage() {
    const imgRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!imgRef.current) return;
        const { left, top, width, height } =
            imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width - 0.5) * 12;
        const y = ((e.clientY - top) / height - 0.5) * 12;
        const img = imgRef.current.querySelector("img");
        if (img) {
            img.style.transform = `scale(1.06) translate(${x}px, ${y}px)`;
        }
    };

    const handleMouseLeave = () => {
        const img = imgRef.current?.querySelector("img");
        if (img) {
            img.style.transform = `scale(1) translate(0px, 0px)`;
        }
    };

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="relative flex flex-col gap-4 p-6 md:p-10">
                <div className="flex items-center justify-between">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <IconBoxAlignRight className="size-6" />
                        <span className="text-base font-bold">NVROX</span>
                        <span className="text-xs text-muted-foreground">
                            /ˈɛn.vaɪ.rɒks/
                        </span>
                    </a>
                    <div className="flex items-center gap-2">
                        <AboutButton />
                        <Separator
                            orientation="vertical"
                            className="data-[orientation=vertical]:h-4"
                        />
                        <ModeToggle />
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <LoginForm />
                    </div>
                </div>

                <footer className="absolute bottom-10 left-0 right-0 text-center text-sm text-muted-foreground">
                    <p>
                        © {new Date().getFullYear()} PT. SMT Indonesia | All
                        rights reserved
                    </p>
                </footer>
            </div>

            {/* Right panel dengan parallax + dark mode transition */}
            <div
                ref={imgRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="bg-muted relative hidden lg:block overflow-hidden"
            >
                <img
                    src={background}
                    alt="Background"
                    className="
						absolute inset-0 h-full w-full object-cover
						brightness-[0.7]
						dark:grayscale dark:brightness-[0.4]
						transition-all duration-700 ease-in-out
					"
                    style={{
                        transition:
                            "transform 0.15s ease-out, filter 0.7s ease, brightness 0.7s ease",
                    }}
                />

                {/* Overlay gradient — lebih gelap di dark mode */}
                <div
                    className="
						absolute inset-0
						bg-gradient-to-t from-black/60 via-transparent to-black/10
						dark:from-black/80 dark:via-black/30 dark:to-black/40
						transition-all duration-700 ease-in-out
					"
                />
            </div>
        </div>
    );
}

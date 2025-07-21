import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const themes = ["light", "dark"] as const;

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const getNextTheme = (current: string) => {
        const index = themes.indexOf(current as (typeof themes)[number]);
        return themes[(index + 1) % themes.length];
    };

    const toggleTheme = () => {
        const nextTheme = getNextTheme(theme);
        setTheme(nextTheme);
    };

    const renderIcon = () => {
        if (theme === "light") return <Moon className="h-4 w-4" />;
        if (theme === "dark") return <Sun className="h-4 w-4" />;
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={toggleTheme}
            aria-label="Toggle Theme">
            {renderIcon()}
        </Button>
    );
}

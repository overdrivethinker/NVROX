import { Thermometer, Droplets } from "lucide-react";

export default function SensorCardGrid() {
    const sensors = Array.from({ length: 30 }, (_, i) => {
        const temp = 20 + (i % 10);
        const humid = 45 + (i % 20);
        return {
            id: i + 1,
            temperature: temp,
            humidity: humid,
        };
    });

    const getTempColor = (temp: number) => {
        if (temp >= 30) return "text-destructive";
        if (temp >= 25) return "text-yellow-600 dark:text-yellow-400";
        return "text-green-600 dark:text-green-400";
    };

    const getHumidColor = (humid: number) => {
        if (humid >= 70) return "text-blue-600 dark:text-blue-400";
        if (humid <= 50) return "text-orange-600 dark:text-orange-400";
        return "text-muted-foreground";
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
            {sensors.map((sensor) => (
                <div
                    key={sensor.id}
                    className="rounded-xl border p-5 space-y-3">
                    <div className="text-xl font-bold text-foreground tracking-tight">
                        NVROX-{sensor.id.toString().padStart(2, "0")}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <Thermometer className="size-6 text-muted-foreground" />
                        <div
                            className={`text-lg font-bold ${getTempColor(
                                sensor.temperature
                            )}`}>
                            {sensor.temperature}°C
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Droplets className="size-6 text-muted-foreground" />
                        <div
                            className={`text-lg font-bold ${getHumidColor(
                                sensor.humidity
                            )}`}>
                            {sensor.humidity}%
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

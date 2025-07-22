import { IconTemperature, IconDroplet } from "@tabler/icons-react";

export default function SensorCardGrid() {
    const sensors = Array.from({ length: 30 }, (_, i) => {
        const temp = 20 + (i % 10);
        const humid = 45 + (i % 20);
        return {
            id: i + 1,
            temperature: temp,
            humidity: humid,
            location: `Building ${1 + i}`,
        };
    });
    const minTemp = 22;
    const maxTemp = 28;
    const minHumid = 50;
    const maxHumid = 70;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-5 p-6">
            {sensors.map((sensor) => (
                <div
                    key={sensor.id}
                    className="rounded-xl overflow-hidden shadow-sm bg-sky-50 dark:bg-sky-800 text-sky-800 dark:text-sky-100 transition-colors"
                >
                    <div className="px-4 py-2 bg-sky-300 dark:bg-sky-700 font-semibold text-sm">
                        NVROX-{sensor.id.toString().padStart(3, "0")} [{sensor.location}]
                    </div>
                    <div className="flex">
                        <div
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-6 rounded-bl-xl transition-colors
        ${sensor.temperature < minTemp || sensor.temperature > maxTemp
                                    ? "bg-red-600 animate-pulse text-white"
                                    : "bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-100"
                                }
    `}
                        >
                            <span className="text-xs mb-1">Temperature</span>
                            <div className="flex items-center">
                                <IconTemperature className="w-8 h-8" />
                                <span className="text-2xl font-bold leading-none">
                                    {sensor.temperature}°C
                                </span>
                            </div>
                        </div>


                        <div
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-6 rounded-br-xl transition-colors
        ${sensor.humidity < minHumid || sensor.humidity > maxHumid
                                    ? "bg-red-600 animate-pulse text-white"
                                    : "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                                }
    `}
                        >
                            <span className="text-xs mb-1">Humidity</span>
                            <div className="flex items-center">
                                <IconDroplet className="w-8 h-8" />
                                <span className="text-2xl font-bold leading-none">
                                    {sensor.humidity}%
                                </span>
                            </div>
                        </div>


                    </div>
                </div>
            ))}
        </div>
    );
}

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import meteoritoImage from '@/../../resources/assets/textures/meteorito.jpeg';
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from '@/components/ui/resizable';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Area, AreaChart, RadialBar, RadialBarChart, PolarGrid, PolarRadiusAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Gráficas',
        href: '/graficas',
    },
];

interface MeteoriteData {
    name: string;
    id: string;
    neo_reference_id: string;
    absolute_magnitude_h: number;
    is_potentially_hazardous_asteroid: boolean;
    estimated_diameter: {
        kilometers: {
            estimated_diameter_min: number;
            estimated_diameter_max: number;
        };
        meters: {
            estimated_diameter_min: number;
            estimated_diameter_max: number;
        };
        miles: {
            estimated_diameter_min: number;
            estimated_diameter_max: number;
        };
    };
    close_approach_data: Array<{
        close_approach_date: string;
        close_approach_date_full: string;
        relative_velocity: {
            kilometers_per_second: string;
            kilometers_per_hour: string;
            miles_per_hour: string;
        };
        miss_distance: {
            astronomical: string;
            lunar: string;
            kilometers: string;
            miles: string;
        };
        orbiting_body: string;
    }>;
    orbital_data: {
        eccentricity: string;
        semi_major_axis: string;
        inclination: string;
        orbital_period: string;
        orbit_class: {
            orbit_class_type: string;
            orbit_class_description: string;
        };
        first_observation_date: string;
        last_observation_date: string;
    };
    is_sentry_object: boolean;
}

export default function Graficas() {
    const [meteoriteData, setMeteoriteData] = useState<MeteoriteData | null>(
        null,
    );
    const [orbitData, setOrbitData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Hardcoded data from mock JSON - always works even if API fails
        const hardcodedData = {
            "name": "35396 (1997 XF11)",
            "id": "2035396",
            "neo_reference_id": "2035396",
            "absolute_magnitude_h": 17.01,
            "estimated_diameter": {
                "kilometers": {
                    "estimated_diameter_min": 1.0533070151,
                    "estimated_diameter_max": 2.3552660868
                },
                "meters": {
                    "estimated_diameter_min": 1053.307015051,
                    "estimated_diameter_max": 2355.2660868313
                },
                "miles": {
                    "estimated_diameter_min": 0.6544944332,
                    "estimated_diameter_max": 1.4634940436
                }
            },
            "is_potentially_hazardous_asteroid": true,
            "close_approach_data": [
                {
                    "close_approach_date": "2028-10-26",
                    "relative_velocity": {
                        "kilometers_per_second": "13.9196802316",
                        "kilometers_per_hour": "50110.8488338442",
                        "miles_per_hour": "31136.9327101184"
                    },
                    "miss_distance": {
                        "astronomical": "0.0062115036",
                        "lunar": "2.4162749004",
                        "kilometers": "929227.708057332",
                        "miles": "577395.3236099016"
                    },
                    "orbiting_body": "Earth"
                }
            ],
            "orbital_data": {
                "eccentricity": "0.4837803333078483",
                "semi_major_axis": "1.442362079629586",
                "inclination": "4.09885688057762",
                "orbital_period": "632.7175355683852",
                "orbit_class": {
                    "orbit_class_type": "APO",
                    "orbit_class_description": "Near-Earth asteroid orbits which cross the Earth's orbit similar to that of 1862 Apollo"
                },
                "first_observation_date": "1990-03-22",
                "last_observation_date": "2025-11-02"
            },
            "is_sentry_object": false
        };

        setMeteoriteData(hardcodedData);
        
        // Try to fetch orbit data, but continue even if it fails
        fetch('/keppler-data-3d')
            .then((response) => response.json())
            .then((orbitResponse) => {
                const transformedData = orbitResponse.data?.map((point: any) => ({
                    t: point.time_sec,
                    vx: point.vx_m_s / 1000,
                    vy: point.vy_m_s / 1000,
                    vz: point.vz_m_s / 1000,
                    v_total: Math.sqrt(
                        Math.pow(point.vx_m_s, 2) + 
                        Math.pow(point.vy_m_s, 2) + 
                        Math.pow(point.vz_m_s, 2)
                    ) / 1000
                })) || [];
                
                setOrbitData(transformedData);
            })
            .catch((err) => {
                console.log('Orbit data unavailable, using hardcoded meteorite data only');
                setOrbitData([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Gráficas" />
                <div className="flex h-full flex-1 items-center justify-center p-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">
                            Cargando datos del meteorito...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !meteoriteData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Gráficas" />
                <div className="flex h-full flex-1 items-center justify-center p-4">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription>
                                No se pudieron cargar los datos del meteorito
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {error || 'Datos no disponibles'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // Obtener el próximo acercamiento (el más cercano en el futuro o el último registrado)
    // Protegemos contra datos faltantes para evitar errores en producción.
    const approaches = Array.isArray(meteoriteData?.close_approach_data)
        ? meteoriteData.close_approach_data
        : [];

    const nextApproach = approaches.length > 0
        ? (approaches.find((approach) => new Date(approach.close_approach_date) > new Date()) || approaches[0])
        : {
            // Valores por defecto seguros cuando no hay datos de acercamiento
            close_approach_date: meteoriteData?.orbital_data?.first_observation_date ?? new Date().toISOString().split('T')[0],
            relative_velocity: {
                kilometers_per_second: '0',
                kilometers_per_hour: '0',
                miles_per_hour: '0',
            },
            miss_distance: {
                astronomical: '0',
                lunar: '0',
                kilometers: '0',
                miles: '0',
            },
            orbiting_body: 'Earth',
        };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gráficas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-2xl">
                                    Ficha Técnica del Meteorito
                                </CardTitle>
                                <CardDescription>
                                    Información detallada del objeto cercano a
                                    la Tierra
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                {meteoriteData.is_potentially_hazardous_asteroid && (
                                    <Badge variant="destructive">
                                        Potencialmente Peligroso
                                    </Badge>
                                )}
                                
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <ResizablePanelGroup direction="horizontal" className="flex-1 gap-4">
                    <ResizablePanel defaultSize={0} minSize={0} >
                        <div className="h-full overflow-auto pr-2 p-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Gráfica de Diámetro Estimado */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Diámetro Estimado</CardTitle>
                                        <CardDescription>
                                            Comparación de tamaños en diferentes unidades
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer
                                            config={{
                                                min: {
                                                    label: "Mínimo",
                                                    color: "#1e40af",
                                                },
                                                max: {
                                                    label: "Máximo",
                                                    color: "#1e40af",
                                                },
                                            }}
                                            className="h-[300px]"
                                        >
                                            <BarChart
                                                data={[
                                                    {
                                                        unit: "Kilómetros",
                                                        min: meteoriteData.estimated_diameter.kilometers.estimated_diameter_min,
                                                        max: meteoriteData.estimated_diameter.kilometers.estimated_diameter_max,
                                                    },
                                                    {
                                                        unit: "Metros",
                                                        min: meteoriteData.estimated_diameter.meters.estimated_diameter_min / 1000,
                                                        max: meteoriteData.estimated_diameter.meters.estimated_diameter_max / 1000,
                                                    },
                                                    {
                                                        unit: "Millas",
                                                        min: meteoriteData.estimated_diameter.miles.estimated_diameter_min,
                                                        max: meteoriteData.estimated_diameter.miles.estimated_diameter_max,
                                                    },
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="unit" />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="min" fill="var(--color-min)" radius={4} />
                                                <Bar dataKey="max" fill="var(--color-max)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                {/* Gráfica de Velocidad Relativa */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Velocidad Relativa</CardTitle>
                                        <CardDescription>
                                            Diferentes mediciones de velocidad
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer
                                            config={{
                                                velocity: {
                                                    label: "Velocidad",
                                                    color: "#1e40af",
                                                },
                                            }}
                                            className="h-[250px]"
                                        >
                                            <AreaChart
                                                data={[
                                                    {
                                                        name: "km/s",
                                                        velocity: parseFloat(nextApproach.relative_velocity.kilometers_per_second),
                                                    },
                                                    {
                                                        name: "km/h",
                                                        velocity: parseFloat(nextApproach.relative_velocity.kilometers_per_hour) / 1000,
                                                    },
                                                    {
                                                        name: "mph",
                                                        velocity: parseFloat(nextApproach.relative_velocity.miles_per_hour) / 1000,
                                                    },
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="velocity"
                                                    stroke="var(--color-velocity)"
                                                    fill="var(--color-velocity)"
                                                    fillOpacity={0.6}
                                                />
                                            </AreaChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                {/* Gráfica de Datos Orbitales */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Parámetros Orbitales</CardTitle>
                                        <CardDescription>
                                            Características principales de la órbita
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer
                                            config={{
                                                value: {
                                                    label: "Valor",
                                                    color: "#1e40af",
                                                },
                                            }}
                                            className="h-[300px]"
                                        >
                                            <BarChart
                                                data={[
                                                    {
                                                        param: "Excentricidad",
                                                        value: parseFloat(meteoriteData.orbital_data.eccentricity),
                                                    },
                                                    {
                                                        param: "Semieje Mayor (AU)",
                                                        value: parseFloat(meteoriteData.orbital_data.semi_major_axis),
                                                    },
                                                    {
                                                        param: "Inclinación (°/10)",
                                                        value: parseFloat(meteoriteData.orbital_data.inclination) / 10,
                                                    },
                                                    {
                                                        param: "Período (días/100)",
                                                        value: parseFloat(meteoriteData.orbital_data.orbital_period) / 100,
                                                    },
                                                ]}
                                                layout="vertical"
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="param" type="category" width={150} />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                {/* Gráfica de Distancia de Acercamiento */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Distancia de Acercamiento</CardTitle>
                                        <CardDescription>
                                            Comparación en diferentes escalas
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer
                                            config={{
                                                distance: {
                                                    label: "Distancia",
                                                    color: "#1e40af",
                                                },
                                            }}
                                            className="h-[250px]"
                                        >
                                            <LineChart
                                                data={[
                                                    {
                                                        unit: "AU",
                                                        distance: parseFloat(nextApproach.miss_distance.astronomical),
                                                    },
                                                    {
                                                        unit: "Lunar",
                                                        distance: parseFloat(nextApproach.miss_distance.lunar) / 100,
                                                    },
                                                    {
                                                        unit: "km (M)",
                                                        distance: parseFloat(nextApproach.miss_distance.kilometers) / 1000000,
                                                    },
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="unit" />
                                                <YAxis />
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                                <Line
                                                    type="monotone"
                                                    dataKey="distance"
                                                    stroke="var(--color-distance)"
                                                    strokeWidth={3}
                                                    dot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>

                                {/* Gráficas de Velocidad */}
                                {orbitData.length > 0 && (
                                    <>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Velocidad en X vs Tiempo</CardTitle>
                                            <CardDescription>
                                                Componente X de la velocidad (km/s) a lo largo del tiempo
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ChartContainer
                                                config={{
                                                    vx: {
                                                        label: "Velocidad X",
                                                        color: "blue",
                                                    },
                                                }}
                                                className="h-[300px]"
                                            >
                                                <LineChart data={orbitData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="t" 
                                                        label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5 }}
                                                    />
                                                    <YAxis 
                                                        label={{ value: 'Velocidad X (km/s)', angle: -90, position: 'insideLeft' }}
                                                    />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="vx" 
                                                        stroke="var(--color-vx)" 
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Velocidad en Y vs Tiempo</CardTitle>
                                            <CardDescription>
                                                Componente Y de la velocidad (km/s) a lo largo del tiempo
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ChartContainer
                                                config={{
                                                    vy: {
                                                        label: "Velocidad Y",
                                                        color: "blue",
                                                    },
                                                }}
                                                className="h-[300px]"
                                            >
                                                <LineChart data={orbitData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="t" 
                                                        label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5 }}
                                                    />
                                                    <YAxis 
                                                        label={{ value: 'Velocidad Y (km/s)', angle: -90, position: 'insideLeft' }}
                                                    />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="vy" 
                                                        stroke="var(--color-vy)" 
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Velocidad en Z vs Tiempo</CardTitle>
                                            <CardDescription>
                                                Componente Z de la velocidad (km/s) a lo largo del tiempo
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ChartContainer
                                                config={{
                                                    vz: {
                                                        label: "Velocidad Z",
                                                        color: "blue",
                                                    },
                                                }}
                                                className="h-[300px]"
                                            >
                                                <LineChart data={orbitData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="t" 
                                                        label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5 }}
                                                    />
                                                    <YAxis 
                                                        label={{ value: 'Velocidad Z (km/s)', angle: -90, position: 'insideLeft' }}
                                                    />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="vz" 
                                                        stroke="var(--color-vz)" 
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Velocidad Total vs Tiempo</CardTitle>
                                            <CardDescription>
                                                Magnitud total de la velocidad (km/s) a lo largo del tiempo
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ChartContainer
                                                config={{
                                                    v_total: {
                                                        label: "Velocidad Total",
                                                        color: "blue",
                                                    },
                                                }}
                                                className="h-[300px]"
                                            >
                                                <LineChart data={orbitData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis 
                                                        dataKey="t" 
                                                        label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5 }}
                                                    />
                                                    <YAxis 
                                                        label={{ value: 'Velocidad Total (km/s)', angle: -90, position: 'insideLeft' }}
                                                    />
                                                    <ChartTooltip content={<ChartTooltipContent />} />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="v_total" 
                                                        stroke="var(--color-v_total)" 
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                            </div>
                        </div>
                        
                    </ResizablePanel>
                    
                    <ResizableHandle className='bg-blue-800 w-1' withHandle />
                    
                    <ResizablePanel defaultSize={100} minSize={0}>
                        <div className="h-full overflow-auto pl-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Imagen del Meteorito</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                                    <img
                                        src={meteoritoImage}
                                        alt={meteoriteData.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Identificación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Nombre
                                    </p>
                                    <p className="font-medium">
                                        {meteoriteData.name}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        ID Referencia NEO
                                    </p>
                                    <p className="font-mono text-sm">
                                        {meteoriteData.neo_reference_id}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Magnitud Absoluta (H)
                                    </p>
                                    <p className="font-medium">
                                        {meteoriteData.absolute_magnitude_h}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Diámetro Estimado</CardTitle>
                                <CardDescription>
                                    Rango de tamaño estimado del objeto
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Kilómetros
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold">
                                            {meteoriteData.estimated_diameter.kilometers.estimated_diameter_min.toFixed(
                                                2,
                                            )}
                                        </span>
                                        <span className="text-muted-foreground">
                                            -
                                        </span>
                                        <span className="text-3xl font-bold">
                                            {meteoriteData.estimated_diameter.kilometers.estimated_diameter_max.toFixed(
                                                2,
                                            )}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            km
                                        </span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Metros
                                        </p>
                                        <p className="text-sm font-medium">
                                            {meteoriteData.estimated_diameter.meters.estimated_diameter_min.toFixed(
                                                0,
                                            )}{' '}
                                            -{' '}
                                            {meteoriteData.estimated_diameter.meters.estimated_diameter_max.toFixed(
                                                0,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Millas
                                        </p>
                                        <p className="text-sm font-medium">
                                            {meteoriteData.estimated_diameter.miles.estimated_diameter_min.toFixed(
                                                2,
                                            )}{' '}
                                            -{' '}
                                            {meteoriteData.estimated_diameter.miles.estimated_diameter_max.toFixed(
                                                2,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Velocidad Relativa</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Kilómetros por segundo
                                    </p>
                                    <p className="text-3xl font-bold">
                                        {parseFloat(
                                            nextApproach.relative_velocity
                                                .kilometers_per_second,
                                        ).toFixed(2)}{' '}
                                        <span className="text-lg text-muted-foreground">
                                            km/s
                                        </span>
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                        Kilómetros por hora
                                    </p>
                                    <p className="font-medium">
                                        {parseFloat(
                                            nextApproach.relative_velocity
                                                .kilometers_per_hour,
                                        ).toLocaleString('es-ES', {
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        km/h
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Próximo Acercamiento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Fecha
                                    </p>
                                    <p className="text-xl font-semibold">
                                        {new Date(
                                            nextApproach.close_approach_date,
                                        ).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Distancia (AU)
                                        </p>
                                        <p className="text-sm font-medium font-mono">
                                            {parseFloat(
                                                nextApproach.miss_distance
                                                    .astronomical,
                                            ).toFixed(6)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Distancia (km)
                                        </p>
                                        <p className="text-sm font-medium">
                                            {parseFloat(
                                                nextApproach.miss_distance
                                                    .kilometers,
                                            ).toLocaleString('es-ES', {
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos Orbitales</CardTitle>
                                <CardDescription>
                                    Parámetros de la órbita del objeto
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Excentricidad
                                    </p>
                                    <p className="font-mono text-lg font-medium">
                                        {parseFloat(
                                            meteoriteData.orbital_data
                                                .eccentricity,
                                        ).toFixed(6)}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Semieje Mayor (AU)
                                    </p>
                                    <p className="font-mono text-lg font-medium">
                                        {parseFloat(
                                            meteoriteData.orbital_data
                                                .semi_major_axis,
                                        ).toFixed(6)}
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Inclinación
                                    </p>
                                    <p className="font-mono text-lg font-medium">
                                        {parseFloat(
                                            meteoriteData.orbital_data
                                                .inclination,
                                        ).toFixed(4)}
                                        °
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Período Orbital
                                    </p>
                                    <p className="font-mono text-lg font-medium">
                                        {parseFloat(
                                            meteoriteData.orbital_data
                                                .orbital_period,
                                        ).toFixed(2)}{' '}
                                        <span className="text-sm text-muted-foreground">
                                            días
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Información Adicional</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Clasificación
                                    </span>
                                    <Badge variant="secondary">
                                        {
                                            meteoriteData.orbital_data
                                                .orbit_class.orbit_class_type
                                        }{' '}
                                        (Apollo)
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Objeto Sentry
                                    </span>
                                    <span className="text-sm font-medium">
                                        {meteoriteData.is_sentry_object
                                            ? 'Sí'
                                            : 'No'}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Primera Observación
                                    </span>
                                    <span className="text-sm font-medium">
                                        {
                                            meteoriteData.orbital_data
                                                .first_observation_date
                                        }
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Última Observación
                                    </span>
                                    <span className="text-sm font-medium">
                                        {
                                            meteoriteData.orbital_data
                                                .last_observation_date
                                        }
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    NASA JPL Database
                                </CardTitle>
                                <CardDescription>
                                    Ver más información
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <a
                                    href={`https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${meteoriteData.neo_reference_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm hover:underline font-medium"
                                >
                                    Abrir en NASA JPL
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </AppLayout>
    );
}

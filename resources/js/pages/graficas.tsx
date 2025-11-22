import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import meteoritoImage from '@/../../resources/assets/textures/meteorito.jpeg';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/meteorites')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error al cargar los datos');
                }
                return response.json();
            })
            .then((data) => {
                setMeteoriteData(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
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
    const nextApproach =
        meteoriteData.close_approach_data.find(
            (approach) =>
                new Date(approach.close_approach_date) > new Date(),
        ) || meteoriteData.close_approach_data[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gráficas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Ficha Técnica del Meteorito
                                </CardTitle>
                                <CardDescription>
                                    Información detallada del objeto cercano a
                                    la Tierra
                                </CardDescription>
                            </div>
                            {meteoriteData.is_potentially_hazardous_asteroid && (
                                <Badge variant="destructive">
                                    Potencialmente Peligroso
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
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
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

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

export default function Graficas() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gráficas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border bg-white dark:bg-gray-900 p-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Gráficas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Visualización de datos y estadísticas del sistema
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

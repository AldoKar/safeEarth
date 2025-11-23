<?php

use App\Http\Controllers\meteoriteController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('simulacion-2d', function () {
        return Inertia::render('simulacion-2d');
    })->name('simulacion-2d');

    Route::get('simulacion-3d', function () {
        return Inertia::render('simulacion-3d');
    })->name('simulacion-3d');

    Route::get('simulacion-tecnica', function () {
        return Inertia::render('simulacion-tecnica');
    })->name('simulacion-tecnica');

    Route::get('graficas', function () {
        return Inertia::render('graficas');
    })->name('graficas');

    Route::get('modelos-defensa', function () {
        return Inertia::render('modelos-defensa');
    })->name('modelos-defensa');
});

// rutas de los meteoritos
Route::get('meteorites', [meteoriteController::class, 'getMeteoriteData'])->name('meteorites');
Route::get('keppler-data', [meteoriteController::class, 'getKepplerData'])->name('keppler-data');
Route::get('keppler-data-3d', [meteoriteController::class, 'getKepplerData3D'])->name('keppler-data-3d');

require __DIR__ . '/settings.php';

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class meteoriteController extends Controller
{
    public function getMeteoriteData()
    {
        $apiKey = env('NASA_API_KEY', 'DEMO_KEY');

        $response = Http::get('https://api.nasa.gov/neo/rest/v1/neo/2035396?api_key=', [
            'api_key' => $apiKey
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return response()->json($data);
        }

        return response()->json(['error' => 'API request failed']);
    }

    public function getKepplerData()
    {
        try {
            $response = Http::timeout(5)->get('http://127.0.0.1:8001/datos');
            if ($response->successful()) {
                $data = $response->json();
                return response()->json($data);
            }
        } catch (\Exception $e) {
            // Return empty data instead of error to prevent frontend crash
            return response()->json(['data' => []]);
        }

        return response()->json(['data' => []]);
    }
}

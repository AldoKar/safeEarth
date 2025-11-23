<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
        $response = Http::get('http://3.141.38.117/datos2D');
        if ($response->successful()) {
            $data = $response->json();
            return response()->json($data);
        }

        return response()->json(['data' => []]);
    }

    public function getKepplerData3D()
    {
        try {
            $response = Http::timeout(10)->get('http://3.141.38.117/datos3D');

            if ($response->successful()) {
                $data = $response->json();

                return response()->json($data);
            }

        } catch (\Exception $e) {
            Log::error('Error fetching Kepler 3D data: ' . $e->getMessage());
        }

        return response()->json(['data' => [], 'metadata' => []]);
    }

    public function defensaDatos2D(){
        $response = Http::timeout(10)->get("http://3.141.38.117/defensaDatos2D");
        if ($response->successful()) {
            $data = $response->json();
            return response()->json($data);
        }
        return response()->json(['data' => []]);
    }

    public function defensaDatos3D(){
        $response = Http::timeout(10)->get("http://3.141.38.117/DefensaDatos3D");
        if ($response->successful()) {
            $data = $response->json();
            return response()->json($data);
        }
        return response()->json(['data' => []]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class meteoriteController extends Controller
{
    public function getMeteoriteData()
    {
        try {
            $apiKey = env('NASA_API_KEY', 'DEMO_KEY');

            $response = Http::timeout(30)
                ->withOptions([
                    'verify' => false, // Bypass SSL verification if needed
                ])
                ->get('https://api.nasa.gov/neo/rest/v1/neo/2035396', [
                    'api_key' => $apiKey
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json($data);
            }

            // Log the actual error response
            Log::error('NASA API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            // Return consistent structure on error to prevent frontend crashes
            return response()->json([
                'name' => 'Unknown',
                'id' => '0',
                'neo_reference_id' => '0',
                'absolute_magnitude_h' => 0,
                'is_potentially_hazardous_asteroid' => false,
                'estimated_diameter' => [
                    'kilometers' => [
                        'estimated_diameter_min' => 0,
                        'estimated_diameter_max' => 0
                    ],
                    'meters' => [
                        'estimated_diameter_min' => 0,
                        'estimated_diameter_max' => 0
                    ],
                    'miles' => [
                        'estimated_diameter_min' => 0,
                        'estimated_diameter_max' => 0
                    ]
                ],
                'close_approach_data' => [],
                'orbital_data' => [
                    'eccentricity' => '0',
                    'semi_major_axis' => '0',
                    'inclination' => '0',
                    'orbital_period' => '0',
                    'orbit_class' => [
                        'orbit_class_type' => 'Unknown',
                        'orbit_class_description' => 'Data unavailable'
                    ],
                    'first_observation_date' => date('Y-m-d'),
                    'last_observation_date' => date('Y-m-d')
                ],
                'is_sentry_object' => false,
                'error' => 'NASA API unavailable'
            ], 200); // Changed to 200 to avoid frontend errors

        } catch (\Exception $e) {
            // Log connection errors (SSL, timeout, DNS, etc.)
            Log::error('NASA API connection error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return consistent structure even on exceptions
            return response()->json([
                'name' => 'Unknown',
                'id' => '0',
                'neo_reference_id' => '0',
                'absolute_magnitude_h' => 0,
                'is_potentially_hazardous_asteroid' => false,
                'estimated_diameter' => [
                    'kilometers' => [
                        'estimated_diameter_min' => 0,
                        'estimated_diameter_max' => 0
                    ],
                    'meters' => [
                        'estimated_diameter_min' => 0,
                        'estimated_diameter_max' => 0
                    ],
                    'miles' => [
                        'estimated_diameter_min' => 0,
                        'estimated_diameter_max' => 0
                    ]
                ],
                'close_approach_data' => [],
                'orbital_data' => [
                    'eccentricity' => '0',
                    'semi_major_axis' => '0',
                    'inclination' => '0',
                    'orbital_period' => '0',
                    'orbit_class' => [
                        'orbit_class_type' => 'Unknown',
                        'orbit_class_description' => 'Data unavailable'
                    ],
                    'first_observation_date' => date('Y-m-d'),
                    'last_observation_date' => date('Y-m-d')
                ],
                'is_sentry_object' => false,
                'error' => 'Server connection error'
            ], 200); // Return 200 so frontend doesn't crash
        }
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

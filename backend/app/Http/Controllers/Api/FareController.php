<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FareController extends Controller
{
    public function calculate(Request $request)
    {
        $distance_km = (float) $request->input('distance_km', 0);
        $is_discounted = filter_var($request->input('is_discounted', false), FILTER_VALIDATE_BOOLEAN);

        $regular_fare = 12.00 + (max(0, ceil($distance_km - 2)) * 2.00);
        $discounted_fare = $regular_fare * 0.80;

        $fare = $is_discounted ? $discounted_fare : $regular_fare;

        return response()->json([
            'distance_km' => $distance_km,
            'is_discounted' => $is_discounted,
            'regular_fare' => number_format($regular_fare, 2, '.', ''),
            'discounted_fare' => number_format($discounted_fare, 2, '.', ''),
            'fare' => number_format($fare, 2, '.', '')
        ]);
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'plate_number' => 'nullable|string',
            'route_name' => 'nullable|string',
            'calculated_fare' => 'required|numeric',
            'charged_fare' => 'nullable|numeric',
            'details' => 'nullable|string'
        ]);

        $report = Report::create($validated);

        return response()->json([
            'message' => 'Report submitted successfully to the local transport office.',
            'report' => $report
        ], 201);
    }
}

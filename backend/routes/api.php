<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FareController;
use App\Http\Controllers\ReportController;
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/fare/calculate', [FareController::class, 'calculate']);

Route::post('/reports', [ReportController::class, 'store']);

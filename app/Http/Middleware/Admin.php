<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class Admin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }
        if (Auth::user()->role !== 'admin') {
            Auth::logout(); 
            return redirect()->route('login');
        }
        return $next($request);
    }
}

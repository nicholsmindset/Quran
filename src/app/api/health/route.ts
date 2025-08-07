import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    // Check database connection
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verses')
      .select('count')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]

    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar]
    )

    // Basic system health metrics
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: !error,
        latency: Date.now(), // Simple latency check
      },
      services: {
        supabase: !error ? 'operational' : 'degraded',
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      },
      configuration: {
        missingEnvVars,
        hasRequiredConfig: missingEnvVars.length === 0,
      },
    }

    // Set overall status based on checks
    if (error || missingEnvVars.length > 0) {
      healthCheck.status = 'degraded'
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
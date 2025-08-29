import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface RecurringCreditConfig {
  id: string
  user_id: string
  amount: number
  period_seconds: number
  next_assignment: string
  status: 'active' | 'paused' | 'cancelled'
  description: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // This function should be called by a cron job or scheduled task
    // In production, add proper authentication for scheduled tasks
    
    console.log('🔄 Processing recurring credits...')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const result = await processRecurringCredits(supabase)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result,
          message: 'Recurring credits processed successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else if (req.method === 'GET') {
      // Get status of recurring credit configurations
      const { data: configs, error: configsError } = await supabase
        .from('recurring_credit_configs')
        .select('*')
        .eq('status', 'active')
        .order('next_assignment', { ascending: true })

      if (configsError) {
        console.error('Error fetching recurring configs:', configsError)
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching recurring configurations' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const now = new Date()
      const dueConfigs = configs?.filter(config => new Date(config.next_assignment) <= now) || []
      const upcomingConfigs = configs?.filter(config => new Date(config.next_assignment) > now) || []

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            totalConfigs: configs?.length || 0,
            dueForProcessing: dueConfigs.length,
            upcomingAssignments: upcomingConfigs.length,
            dueConfigs: dueConfigs.slice(0, 10), // Show first 10
            nextAssignments: upcomingConfigs.slice(0, 5) // Show next 5
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Process Recurring Credits API error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Process all due recurring credit assignments
 */
async function processRecurringCredits(supabase: any) {
  try {
    const now = new Date()
    
    // Get all active recurring credit configurations that are due
    const { data: dueConfigs, error: configsError } = await supabase
      .from('recurring_credit_configs')
      .select('*')
      .eq('status', 'active')
      .lte('next_assignment', now.toISOString())

    if (configsError) {
      console.error('Error fetching due configs:', configsError)
      return { error: 'Failed to fetch due configurations', processed: 0 }
    }

    if (!dueConfigs || dueConfigs.length === 0) {
      console.log('✅ No recurring credits due for processing')
      return { processed: 0, message: 'No recurring credits due' }
    }

    console.log(`📋 Found ${dueConfigs.length} recurring credit configurations due for processing`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const config of dueConfigs) {
      try {
        console.log(`🔄 Processing recurring credits for user ${config.user_id}, amount: $${config.amount}`)
        
        // Assign the recurring credits
        const assignmentResult = await assignRecurringCreditInstance(supabase, config)
        
        if (assignmentResult.success) {
          // Update next assignment time
          const nextAssignment = new Date(now.getTime() + config.period_seconds * 1000)
          
          const { error: updateError } = await supabase
            .from('recurring_credit_configs')
            .update({ 
              next_assignment: nextAssignment.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', config.id)

          if (updateError) {
            console.error(`Error updating next assignment for config ${config.id}:`, updateError)
            errorCount++
            results.push({
              configId: config.id,
              userId: config.user_id,
              success: false,
              error: 'Failed to update next assignment time'
            })
          } else {
            successCount++
            results.push({
              configId: config.id,
              userId: config.user_id,
              success: true,
              amount: config.amount,
              nextAssignment: nextAssignment.toISOString()
            })
            console.log(`✅ Successfully processed recurring credits for user ${config.user_id}`)
          }
        } else {
          errorCount++
          results.push({
            configId: config.id,
            userId: config.user_id,
            success: false,
            error: assignmentResult.error
          })
          console.error(`❌ Failed to process recurring credits for user ${config.user_id}:`, assignmentResult.error)
        }
      } catch (error) {
        errorCount++
        results.push({
          configId: config.id,
          userId: config.user_id,
          success: false,
          error: error.message
        })
        console.error(`❌ Error processing config ${config.id}:`, error)
      }
    }

    console.log(`📊 Processing complete: ${successCount} successful, ${errorCount} errors`)

    return {
      processed: dueConfigs.length,
      successful: successCount,
      errors: errorCount,
      results: results
    }
  } catch (error) {
    console.error('Error in processRecurringCredits:', error)
    return { error: 'Failed to process recurring credits', processed: 0 }
  }
}

/**
 * Assign a single instance of recurring credits
 */
async function assignRecurringCreditInstance(supabase: any, config: RecurringCreditConfig) {
  try {
    // Create a new spend permission for the recurring credits
    const startTimestamp = new Date()
    const endTimestamp = new Date(startTimestamp.getTime() + config.period_seconds * 1000)

    const { data: newPermission, error: permissionError } = await supabase
      .from('permissions')
      .insert([
        {
          user_id: config.user_id,
          token_address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          cap_amount: config.amount,
          period_seconds: config.period_seconds,
          start_timestamp: startTimestamp.toISOString(),
          end_timestamp: endTimestamp.toISOString(),
          spender_address: '0x0000000000000000000000000000000000000000', // Placeholder
          permission_signature: '0x0000000000000000000000000000000000000000000000000000000000000000', // Placeholder
          status: 'active'
        }
      ])
      .select()
      .single()

    if (permissionError) {
      console.error('Error creating recurring permission:', permissionError)
      return { success: false, error: 'Failed to create spend permission' }
    }

    // Initialize credit usage tracking
    const { error: usageError } = await supabase
      .from('credit_usage')
      .insert([
        {
          user_id: config.user_id,
          permission_id: newPermission.id,
          period_start: startTimestamp.toISOString(),
          period_end: endTimestamp.toISOString(),
          total_limit: config.amount,
          used_amount: 0,
          transaction_count: 0
        }
      ])

    if (usageError) {
      console.error('Error initializing credit usage:', usageError)
      // Don't fail the request, just log the error
    }

    // Record the credit assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('credit_assignments')
      .insert([
        {
          user_id: config.user_id,
          amount: config.amount,
          credit_type: 'recurring',
          assigned_at: new Date().toISOString(),
          expires_at: endTimestamp.toISOString(),
          status: 'active',
          description: `Recurring credit assignment: ${config.description}`,
          metadata: { 
            ...config.metadata, 
            recurring_config_id: config.id,
            permission_id: newPermission.id,
            is_recurring: true,
            period_seconds: config.period_seconds
          }
        }
      ])
      .select()
      .single()

    if (assignmentError) {
      console.error('Error recording recurring credit assignment:', assignmentError)
      return { success: false, error: 'Failed to record credit assignment' }
    }

    return {
      success: true,
      data: {
        permission: newPermission,
        assignment: assignment
      }
    }
  } catch (error) {
    console.error('Error in assignRecurringCreditInstance:', error)
    return { success: false, error: 'Failed to assign recurring credit instance' }
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0"

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // CORS setup
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      } 
    })
  }

  try {
    // Basic input validation
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    let body;
    try {
      body = await req.json()
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
    }

    const { data, type } = body
    
    // Mercado Pago sends different types of notifications. 
    // We are primarily interested in 'payment'
    if (type !== 'payment' && body.resource === undefined) {
      return new Response(JSON.stringify({ received: true, message: 'Type ignored' }), { status: 200 })
    }

    const paymentId = data?.id || body.resource?.split('/').pop()
    
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Payment ID is required' }), { status: 400 })
    }

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables')
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
    }

    // Fetch payment from Mercado Pago to verify status server-side
    // This is a critical security step to ensure the notification is legitimate
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
    })
    
    if (!mpRes.ok) {
      console.error(`Mercado Pago API error: ${mpRes.status}`)
      return new Response(JSON.stringify({ error: 'Failed to verify payment with provider' }), { status: 400 })
    }
    
    const payment = await mpRes.json()
    
    if (payment.status === 'approved') {
      const orderId = payment.metadata?.order_id
      
      if (!orderId) {
        console.warn('Payment approved but no order_id found in metadata')
        return new Response(JSON.stringify({ received: true, message: 'No order ID' }), { status: 200 })
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      
      // Update order status securely
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          payment_id: String(paymentId),
          payment_status: payment.status
        })
        .eq('id', orderId)
        .eq('status', 'pending') // Only update if it was pending
        
      if (error) {
        console.error('Supabase update error:', error)
        throw new Error('Database update failed')
      }
      
      console.log(`Order ${orderId} marked as paid. Payment ID: ${paymentId}`)
    } else {
      console.log(`Payment ${paymentId} status: ${payment.status}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    // Don't leak internal error messages to the client
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

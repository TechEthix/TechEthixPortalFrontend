// client/src/hooks/useCashfree.js
import { useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export const useCashfree = () => {
  const [loading, setLoading] = useState(false)

  const initiatePayment = async (paymentId, onSuccess) => {
    setLoading(true)
    try {
      // Create order on backend
      const { data } = await api.post('/payments/create-order', {
        payment_id: paymentId
      })

      if (!data.success) {
        toast.error(data.message || 'Could not initiate payment.')
        return
      }

      const { payment_session_id, order_id } = data.data

      // Load Cashfree JS SDK dynamically
      if (!window.Cashfree) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src   = process.env.CASHFREE_ENV === 'PROD'
            ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
            : 'https://sdk.cashfree.com/js/v3/cashfree.js'
          script.onload  = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const cashfree = window.Cashfree({
        mode: import.meta.env.VITE_CASHFREE_ENV === 'PROD' ? 'production' : 'sandbox'
      })

      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget:   '_modal',
      }).then(async result => {
        if (result.error) {
          toast.error(result.error.message || 'Payment failed.')
          return
        }

        if (result.redirect) {
          // Redirect flow — verify on return
          return
        }

        // Modal flow — verify now
        const verify = await api.get(`/payments/verify?order_id=${order_id}&payment_id=${paymentId}`)

        if (verify.data.status === 'paid') {
          toast.success('Payment successful!')
          onSuccess && onSuccess()
        } else {
          toast.error('Payment not confirmed. Please try again or contact us.')
        }
      })
    } catch (err) {
      console.error('Payment error:', err)
      toast.error(err.response?.data?.message || 'Payment initiation failed.')
    } finally {
      setLoading(false)
    }
  }

  return { initiatePayment, loading }
}

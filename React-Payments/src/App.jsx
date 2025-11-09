import { useState } from 'react'
import './App.css'

function App() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  // Handle Payment
  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setLoading(true)

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.')
      setLoading(false)
      return
    }

    try {
      // Create order from backend
      const response = await fetch('http://localhost:5000/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'INR',
        }),
      })

      const data = await response.json()

      if (!data.success) {
        alert('Failed to create order. Please try again.')
        setLoading(false)
        return
      }

      // Configure Razorpay options
      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'My Payments App',
        description: 'Payment for your order',
        order_id: data.order.id,
        handler: async function (response) {
          // Verify payment on backend
          try {
            const verifyResponse = await fetch('http://localhost:5000/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              alert('Payment Successful! 🎉\nPayment ID: ' + response.razorpay_payment_id)
              setAmount('') // Reset amount
            } else {
              alert('Payment verification failed!')
            }
          } catch (error) {
            console.error('Verification error:', error)
            alert('Payment verification failed!')
          }
          setLoading(false)
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999',
        },
        notes: {
          address: 'Customer Address',
        },
        theme: {
          color: '#22c55e', // Green theme
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
            alert('Payment cancelled')
          },
        },
      }

      // Open Razorpay checkout
      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="payment-card">
        <h1>💳 Razorpay Payment Gateway</h1>
        <p className="subtitle">Enter amount and proceed to payment</p>
        
        <div className="input-group">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            min="1"
          />
        </div>

        <button 
          className="pay-button"
          onClick={handlePayment}
          disabled={loading || !amount}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>

        <div className="info-box">
          <p>🔒 Secure payment powered by Razorpay</p>
          <p>Supports UPI, Cards, Wallets & more</p>
        </div>
      </div>
    </div>
  )
}

export default App

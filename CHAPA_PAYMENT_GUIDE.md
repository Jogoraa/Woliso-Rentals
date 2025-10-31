# Chapa Payment Integration Guide

## Overview
The Woliso Rental System now integrates with Chapa payment gateway for secure deposit payments.

## Setup Instructions

### 1. Obtain Chapa API Credentials
- Sign up at https://chapa.co/
- Navigate to your dashboard and get your Secret Key
- Copy your Secret Key

### 2. Configure Environment Variables
Add your Chapa Secret Key to `/app/backend/.env`:

```
CHAPA_SECRET_KEY=your_actual_chapa_secret_key_here
```

### 3. Restart Backend Service
After adding the key, restart the backend:

```bash
sudo supervisorctl restart backend
```

## How It Works

### Payment Flow:
1. **Booking Approval**: Tenant requests a booking, landlord approves it
2. **Payment Initialization**: Tenant sees "Proceed to Payment" button on approved bookings
3. **Chapa Checkout**: Tenant is redirected to Chapa's secure checkout page
4. **Payment Completion**: After payment, user is redirected back to the app
5. **Verification**: System automatically verifies payment with Chapa
6. **Confirmation**: Booking is marked as "deposit paid"

### API Endpoints:

#### Initialize Payment
```
POST /api/payment/initialize
Headers: Authorization: Bearer <token>
Body: {
  "booking_id": "booking-uuid",
  "amount": 500,
  "currency": "ETB"
}
Response: {
  "checkout_url": "https://checkout.chapa.co/...",
  "tx_ref": "WRS-..."
}
```

#### Verify Payment
```
GET /api/payment/verify/{tx_ref}
Headers: Authorization: Bearer <token>
Response: {
  "status": "success" | "failed",
  "message": "...",
  "data": { ... }
}
```

## Database Collections

### Payments Collection
```javascript
{
  payment_id: "uuid",
  booking_id: "uuid",
  tenant_id: "uuid",
  house_id: "uuid",
  tx_ref: "WRS-...",
  amount: 500,
  currency: "ETB",
  status: "pending" | "success" | "failed",
  created_at: "ISO timestamp",
  verified_at: "ISO timestamp" (optional),
  chapa_response: { ... } (optional)
}
```

## Frontend Components

### Payment Button (TenantDashboard)
Shows on approved bookings that haven't been paid yet:
```jsx
<Button onClick={() => handleProceedToPayment(booking.booking_id)}>
  Proceed to Payment (500 ETB)
</Button>
```

### Payment Callback Page
Handles redirect from Chapa and verifies payment:
- Route: `/payment/callback?tx_ref=...&status=...`
- Automatically verifies payment
- Shows success/failure message
- Redirects to tenant dashboard

## Testing

### Test Mode (Development)
Chapa provides test credentials for development:
- Use test secret key from Chapa dashboard
- Test card numbers are provided in Chapa documentation

### Production
- Replace test secret key with live secret key
- Ensure FRONTEND_URL is set correctly in backend/.env
- Test with small amounts first

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with actual keys
2. **HTTPS**: Always use HTTPS in production
3. **Verification**: Always verify payments server-side (already implemented)
4. **User Authentication**: All payment endpoints require authentication

## Troubleshooting

### Payment initialization fails
- Check if CHAPA_SECRET_KEY is set correctly
- Verify booking is in "approved" status
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`

### Payment verification fails
- Ensure tx_ref is correct
- Check Chapa dashboard for transaction status
- Verify network connectivity

### Callback doesn't work
- Check FRONTEND_URL in backend/.env
- Ensure callback route is accessible
- Check Chapa webhook settings in dashboard

## Support
For Chapa-specific issues, contact Chapa support: https://chapa.co/support

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      const txRef = searchParams.get('tx_ref');
      const chapaStatus = searchParams.get('status');

      if (!txRef) {
        setStatus('failed');
        setMessage('Invalid payment reference');
        return;
      }

      try {
        const response = await axios.get(`${API}/payment/verify/${txRef}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.status === 'success') {
          setStatus('success');
          setMessage('Payment verified successfully!');
        } else {
          setStatus('failed');
          setMessage('Payment verification failed');
        }
      } catch (error) {
        setStatus('failed');
        setMessage(error.response?.data?.detail || 'Payment verification failed');
      }
    };

    verifyPayment();
  }, [searchParams, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-indigo-600 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/tenant/dashboard')}
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Button 
                className="w-full"
                onClick={() => navigate('/tenant/dashboard')}
              >
                Back to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;



import os
import requests
import logging
import re
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

# --- Step 1: Load environment variables from .env file FIRST ---
# This ensures that os.environ.get() calls below have the correct values
load_dotenv() 

logger = logging.getLogger(__name__)

# --- Step 2: Define Configuration and Constants ---
# Use os.environ.get() AFTER calling load_dotenv()
CHAPA_SECRET_KEY = os.environ.get('CHAPA_SECRET_KEY', '')
CHAPA_BASE_URL = os.environ.get('CHAPA_API_URL', "https://api.chapa.co/v1")


class ChapaService:
    """Service for handling Chapa payment gateway integration with all features"""
    
    def __init__(self):
        self.secret_key = CHAPA_SECRET_KEY
        self.base_url = CHAPA_BASE_URL

    def initialize_payment(
        self,
        amount: float,
        currency: str,
        tx_ref: str,
        callback_url: str,
        return_url: str,
        email: str,
        first_name: str,
        last_name: str,
        phone_number: Optional[str] = None,
        customization: Optional[Dict[str, str]] = None,
        subaccounts: Optional[List[Dict[str, Any]]] = None
    ) -> Dict:
        """
        Initialize a payment transaction with Chapa
        
        Args:
            amount: Payment amount
            currency: Currency code (ETB for Ethiopian Birr)
            tx_ref: Unique transaction reference
            callback_url: URL for webhook callbacks
            return_url: URL to redirect after payment completion
            email: Customer email
            first_name: Customer first name
            last_name: Customer last name
            phone_number: Customer phone number (10 digits, 09xxxxxxxx or 07xxxxxxxx)
            customization: Customization options for checkout page
            subaccounts: List of subaccounts for split payments
            
        Returns:
            Dictionary containing payment initialization response
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "amount": str(amount),
            "currency": currency,
            "tx_ref": tx_ref,
            "callback_url": callback_url,
            "return_url": return_url,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "customization": customization or {
                "title": "Qine Zemari Music Payment",
                "description": "Payment for premium music subscription"
            }
        }
        
        # Add phone number if provided (must be 10 digits)
        if phone_number:
            if len(phone_number) == 10 and phone_number.startswith(('09', '07')):
                payload["phone_number"] = phone_number
            else:
                raise PaymentGatewayError("Phone number must be 10 digits starting with 09 or 07")
        
        # Add subaccounts for split payments
        if subaccounts:
            payload["subaccounts"] = subaccounts
        
        try:
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'success':
                checkout_url = data['data']['checkout_url']
                logger.info(f"Payment initialized successfully. Checkout URL: {checkout_url}")
                return {
                    'status': 'success',
                    'checkout_url': checkout_url,
                    'tx_ref': tx_ref,
                    'data': data['data']
                }
            else:
                error_message = data.get('message', 'Unknown error occurred')
                logger.error(f"Chapa payment initialization failed: {error_message}")
                raise PaymentGatewayError(f"Payment initialization failed: {error_message}")
                
        except requests.exceptions.RequestException as e:
            status = None
            try:
                status = e.response.status_code  # type: ignore[attr-defined]
            except Exception:
                status = None
            logger.error(f"Chapa payment initialization failed: {str(e)}")
            raise PaymentGatewayError(f"Payment initialization failed: {str(e)}", status)

    def verify_payment(self, tx_ref: str) -> Dict:
        """
        Verify a payment transaction with Chapa
        
        Args:
            tx_ref: Transaction reference to verify
            
        Returns:
            Dictionary containing payment verification response
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/transaction/verify/{tx_ref}",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'success':
                logger.info(f"Payment verified successfully for tx_ref: {tx_ref}")
                return {
                    'status': 'success',
                    'verified': True,
                    'payment_data': data['data']
                }
            else:
                return {
                    'status': 'failed',
                    'verified': False,
                    'message': data.get('message', 'Verification failed')
                }
                
        except requests.exceptions.RequestException as e:
            status = None
            try:
                status = e.response.status_code  # type: ignore[attr-defined]
            except Exception:
                status = None
            logger.error(f"Chapa payment verification failed: {str(e)}")
            raise PaymentGatewayError(f"Payment verification failed: {str(e)}", status)

    def cancel_payment(self, tx_ref: str) -> Dict:
        """
        Cancel an active payment transaction
        
        Args:
            tx_ref: Transaction reference to cancel
            
        Returns:
            Dictionary containing cancellation response
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.put(
                f"{self.base_url}/transaction/cancel/{tx_ref}",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'success':
                logger.info(f"Payment cancelled successfully for tx_ref: {tx_ref}")
                return {
                    'status': 'success',
                    'cancelled': True,
                    'message': data.get('message', 'Transaction cancelled successfully')
                }
            else:
                logger.error(f"Payment cancellation failed: {data.get('message')}")
                return {
                    'status': 'failed',
                    'cancelled': False,
                    'message': data.get('message', 'Cancellation failed')
                }
                
        except requests.exceptions.RequestException as e:
            status = None
            try:
                status = e.response.status_code  # type: ignore[attr-defined]
            except Exception:
                status = None
            logger.error(f"Chapa payment cancellation failed: {str(e)}")
            raise PaymentGatewayError(f"Payment cancellation failed: {str(e)}", status)

    def create_subaccount(
        self,
        account_name: str,
        bank_code: int,
        account_number: str,
        split_value: float,
        split_type: str,
        business_name: Optional[str] = None
    ) -> Dict:
        """
        Create a subaccount for split payments
        
        Args:
            account_name: Vendor/merchant account name
            bank_code: Bank ID (from get_banks endpoint)
            account_number: Bank account number
            split_value: Commission amount (0.03 for 3% or 25 for flat fee)
            split_type: 'percentage' or 'flat'
            business_name: Vendor/merchant business name
            
        Returns:
            Dictionary containing subaccount creation response
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "account_name": account_name,
            "bank_code": bank_code,
            "account_number": account_number,
            "split_value": split_value,
            "split_type": split_type
        }
        
        if business_name:
            payload["business_name"] = business_name
        
        try:
            response = requests.post(
                f"{self.base_url}/subaccount",
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'success':
                subaccount_id = data['data']['id']
                logger.info(f"Subaccount created successfully: {subaccount_id}")
                return {
                    'status': 'success',
                    'subaccount_id': subaccount_id,
                    'data': data['data']
                }
            else:
                error_message = data.get('message', 'Unknown error occurred')
                logger.error(f"Subaccount creation failed: {error_message}")
                raise PaymentGatewayError(f"Subaccount creation failed: {error_message}")
                
        except requests.exceptions.RequestException as e:
            status = None
            try:
                status = e.response.status_code  # type: ignore[attr-defined]
            except Exception:
                status = None
            logger.error(f"Subaccount creation failed: {str(e)}")
            raise PaymentGatewayError(f"Subaccount creation failed: {str(e)}", status)

    def get_supported_currencies(self) -> Dict:
        """
        Get list of supported currencies and countries
        
        Returns:
            Dictionary containing supported currencies
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}"
        }
        
        try:
            response = requests.get(
                f"{self.base_url}/currency_supported",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                'status': 'success',
                'currencies': data.get('data', [])
            }
            
        except requests.exceptions.RequestException as e:
            status = None
            try:
                status = e.response.status_code  # type: ignore[attr-defined]
            except Exception:
                status = None
            logger.error(f"Failed to fetch supported currencies: {str(e)}")
            raise PaymentGatewayError(f"Failed to fetch supported currencies: {str(e)}", status)

    def get_payment_receipt_url(self, chapa_reference_id: str) -> str:
        """
        Generate payment receipt URL
        
        Args:
            chapa_reference_id: Chapa's internal reference ID from payment response
            
        Returns:
            Receipt URL string
        """
        return f"https://chapa.link/payment-receipt/{chapa_reference_id}"

    def initialize_split_payment(
        self,
        amount: float,
        currency: str,
        tx_ref: str,
        callback_url: str,
        return_url: str,
        email: str,
        first_name: str,
        last_name: str,
        subaccount_id: str,
        split_type: Optional[str] = None,
        split_value: Optional[float] = None,
        phone_number: Optional[str] = None,
        customization: Optional[Dict[str, str]] = None
    ) -> Dict:
        """
        Initialize a split payment transaction
        
        Args:
            amount: Payment amount
            currency: Currency code
            tx_ref: Unique transaction reference
            callback_url: URL for webhook callbacks
            return_url: URL to redirect after payment
            email: Customer email
            first_name: Customer first name
            last_name: Customer last name
            subaccount_id: Subaccount ID for split payment
            split_type: Override split type ('percentage' or 'flat')
            split_value: Override split value
            phone_number: Customer phone number
            customization: Checkout customization
            
        Returns:
            Dictionary containing split payment initialization response
        """
        subaccount_data = {"id": subaccount_id}
        
        # Override default split settings if provided
        if split_type and split_value is not None:
            subaccount_data.update({
                "split_type": split_type,
                "split_value": split_value
            })
        
        return self.initialize_payment(
            amount=amount,
            currency=currency,
            tx_ref=tx_ref,
            callback_url=callback_url,
            return_url=return_url,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            customization=customization,
            subaccounts=[subaccount_data]
        )


class PaymentGatewayError(Exception):
    """Raised when the payment gateway returns an error. Carries optional HTTP status."""
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


# Helper functions for common payment operations
def generate_transaction_reference(prefix: str = "qine") -> str:
    """Generate unique transaction reference"""
    import uuid
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def validate_phone_number(phone_number: str) -> bool:
    """Validate Ethiopian phone number format"""
    return len(phone_number) == 10 and phone_number.startswith(('09', '07'))


# Singleton instance
chapa_service = ChapaService()



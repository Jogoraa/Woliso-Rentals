import os
import requests
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

CHAPA_SECRET_KEY = os.environ.get('CHAPA_SECRET_KEY', '')
CHAPA_BASE_URL = "https://api.chapa.co/v1"


class ChapaService:
    """Service for handling Chapa payment gateway integration"""
    
    def __init__(self):
        self.secret_key = CHAPA_SECRET_KEY
        self.base_url = CHAPA_BASE_URL
        
    def initialize_payment(
        self,
        amount: float,
        currency: str,
        tx_ref: str,
        callback_url: str,
        email: str,
        first_name: str,
        last_name: str,
        phone_number: Optional[str] = None
    ) -> Dict:
        """
        Initialize a payment transaction with Chapa
        
        Args:
            amount: Payment amount
            currency: Currency code (ETB for Ethiopian Birr)
            tx_ref: Unique transaction reference
            callback_url: URL to redirect after payment
            email: Customer email
            first_name: Customer first name
            last_name: Customer last name
            phone_number: Customer phone number (optional)
            
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
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "customization": {
                "title": "Woliso Rental Deposit Payment",
                "description": "Rental deposit payment for property booking"
            }
        }
        
        if phone_number:
            payload["phone_number"] = phone_number
        
        try:
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Chapa payment initialization failed: {str(e)}")
            raise Exception(f"Payment initialization failed: {str(e)}")
    
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
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Chapa payment verification failed: {str(e)}")
            raise Exception(f"Payment verification failed: {str(e)}")


# Singleton instance
chapa_service = ChapaService()

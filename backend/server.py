from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import shutil
from chapa_service import chapa_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: str  # tenant, landlord, admin

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class HouseBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: str
    price_per_month: float
    num_rooms: int

class HouseCreate(HouseBase):
    pass

class House(HouseBase):
    model_config = ConfigDict(extra="ignore")
    house_id: str
    landlord_id: str
    status: str  # available, pending_approval, rented, hidden
    photos: List[str] = []
    created_at: str

class HouseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    price_per_month: Optional[float] = None
    num_rooms: Optional[int] = None
    status: Optional[str] = None

class BookingCreate(BaseModel):
    house_id: str
    message: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    tenant_id: str
    house_id: str
    landlord_id: str
    status: str  # pending, approved, rejected
    message: Optional[str] = None
    requested_at: str
    deposit_paid: Optional[bool] = False

class BookingUpdate(BaseModel):
    status: str  # approved or rejected

class FeedbackCreate(BaseModel):
    house_id: str
    rating: int  # 1-5
    comment: Optional[str] = None

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    feedback_id: str
    tenant_id: str
    house_id: str
    rating: int
    comment: Optional[str] = None
    submitted_at: str

class AdminStatsResponse(BaseModel):
    total_users: int
    total_houses: int
    pending_houses: int
    total_bookings: int

class PaymentInitRequest(BaseModel):
    booking_id: str
    amount: float = 500.0  # Default deposit amount in ETB
    currency: str = "ETB"

class PaymentInitResponse(BaseModel):
    checkout_url: str
    tx_ref: str

class SavedHouseCreate(BaseModel):
    house_id: str

class SavedHouse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    saved_id: str
    tenant_id: str
    house_id: str
    saved_at: str

class LandlordAnalytics(BaseModel):
    total_properties: int
    total_views: int
    pending_bookings: int
    approved_bookings: int
    total_revenue: float

# ============ UTILITY FUNCTIONS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_role(user: dict, allowed_roles: List[str]):
    if user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if user_data.role not in ["tenant", "landlord", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "phone_number": user_data.phone_number,
        "role": user_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token({"user_id": user_id, "role": user_data.role})
    
    user_response = User(
        user_id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        role=user_data.role,
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"user_id": user["user_id"], "role": user["role"]})
    
    user_response = User(
        user_id=user["user_id"],
        email=user["email"],
        full_name=user["full_name"],
        phone_number=user.get("phone_number"),
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ============ UPLOAD ROUTES ============

@api_router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL
    file_url = f"/uploads/{unique_filename}"
    return {"url": file_url}

# ============ HOUSE ROUTES ============

@api_router.get("/houses", response_model=List[House])
async def get_houses(
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    num_rooms: Optional[int] = None,
    status: Optional[str] = "available"
):
    query = {}
    
    if status:
        query["status"] = status
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    if min_price is not None or max_price is not None:
        query["price_per_month"] = {}
        if min_price is not None:
            query["price_per_month"]["$gte"] = min_price
        if max_price is not None:
            query["price_per_month"]["$lte"] = max_price
    
    if num_rooms is not None:
        query["num_rooms"] = num_rooms
    
    houses = await db.houses.find(query, {"_id": 0}).to_list(1000)
    return houses

@api_router.get("/houses/{house_id}", response_model=House)
async def get_house(house_id: str):
    house = await db.houses.find_one({"house_id": house_id}, {"_id": 0})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    return house

@api_router.post("/houses", response_model=House)
async def create_house(
    house_data: HouseCreate,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["landlord"])
    
    house_id = str(uuid.uuid4())
    house_doc = {
        "house_id": house_id,
        "landlord_id": current_user["user_id"],
        "title": house_data.title,
        "description": house_data.description,
        "location": house_data.location,
        "price_per_month": house_data.price_per_month,
        "num_rooms": house_data.num_rooms,
        "status": "pending_approval",
        "photos": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.houses.insert_one(house_doc)
    return House(**house_doc)

@api_router.put("/houses/{house_id}", response_model=House)
async def update_house(
    house_id: str,
    house_data: HouseUpdate,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["landlord"])
    
    house = await db.houses.find_one({"house_id": house_id}, {"_id": 0})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    if house["landlord_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this house")
    
    update_data = {k: v for k, v in house_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.houses.update_one({"house_id": house_id}, {"$set": update_data})
        house.update(update_data)
    
    return House(**house)

@api_router.delete("/houses/{house_id}")
async def delete_house(
    house_id: str,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["landlord"])
    
    house = await db.houses.find_one({"house_id": house_id})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    if house["landlord_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this house")
    
    await db.houses.delete_one({"house_id": house_id})
    return {"message": "House deleted successfully"}

@api_router.post("/houses/{house_id}/photos")
async def add_house_photos(
    house_id: str,
    photo_urls: List[str],
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["landlord"])
    
    house = await db.houses.find_one({"house_id": house_id})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    if house["landlord_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this house")
    
    await db.houses.update_one(
        {"house_id": house_id},
        {"$push": {"photos": {"$each": photo_urls}}}
    )
    
    return {"message": "Photos added successfully"}

@api_router.get("/my-houses", response_model=List[House])
async def get_my_houses(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["landlord"])
    
    houses = await db.houses.find(
        {"landlord_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return houses

# ============ BOOKING ROUTES ============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(
    booking_data: BookingCreate,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["tenant"])
    
    house = await db.houses.find_one({"house_id": booking_data.house_id})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    if house["status"] != "available":
        raise HTTPException(status_code=400, detail="House is not available")
    
    # Check if already requested
    existing_booking = await db.bookings.find_one({
        "tenant_id": current_user["user_id"],
        "house_id": booking_data.house_id,
        "status": "pending"
    })
    if existing_booking:
        raise HTTPException(status_code=400, detail="You already have a pending request for this house")
    
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "booking_id": booking_id,
        "tenant_id": current_user["user_id"],
        "house_id": booking_data.house_id,
        "landlord_id": house["landlord_id"],
        "status": "pending",
        "message": booking_data.message,
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    return Booking(**booking_doc)

@api_router.get("/bookings/my-requests", response_model=List[Booking])
async def get_my_booking_requests(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["tenant"])
    
    bookings = await db.bookings.find(
        {"tenant_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return bookings

@api_router.get("/bookings/received", response_model=List[Booking])
async def get_received_bookings(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["landlord"])
    
    bookings = await db.bookings.find(
        {"landlord_id": current_user["user_id"]},
        {"_id": 0}
    ).to_list(1000)
    
    return bookings

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    booking_update: BookingUpdate,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["landlord"])
    
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["landlord_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this booking")
    
    if booking_update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": booking_update.status}}
    )
    
    # If approved, mark house as rented
    if booking_update.status == "approved":
        await db.houses.update_one(
            {"house_id": booking["house_id"]},
            {"$set": {"status": "rented"}}
        )
    
    booking["status"] = booking_update.status
    return Booking(**booking)

# ============ FEEDBACK ROUTES ============

@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(
    feedback_data: FeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["tenant"])
    
    if feedback_data.rating < 1 or feedback_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    house = await db.houses.find_one({"house_id": feedback_data.house_id})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    feedback_id = str(uuid.uuid4())
    feedback_doc = {
        "feedback_id": feedback_id,
        "tenant_id": current_user["user_id"],
        "house_id": feedback_data.house_id,
        "rating": feedback_data.rating,
        "comment": feedback_data.comment,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.feedbacks.insert_one(feedback_doc)
    return Feedback(**feedback_doc)

@api_router.get("/houses/{house_id}/feedback", response_model=List[Feedback])
async def get_house_feedback(house_id: str):
    feedbacks = await db.feedbacks.find(
        {"house_id": house_id},
        {"_id": 0}
    ).to_list(1000)
    return feedbacks

# ============ PAYMENT ROUTES ============

@api_router.post("/payment/initialize", response_model=PaymentInitResponse)
async def initialize_payment(
    payment_data: PaymentInitRequest,
    current_user: dict = Depends(get_current_user)
):
    """Initialize Chapa payment for booking deposit"""
    await require_role(current_user, ["tenant"])
    
    # Verify booking exists and belongs to current user
    booking = await db.bookings.find_one({
        "booking_id": payment_data.booking_id,
        "tenant_id": current_user["user_id"]
    })
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != "approved":
        raise HTTPException(status_code=400, detail="Only approved bookings can proceed to payment")
    
    # Check if payment already exists
    existing_payment = await db.payments.find_one({"booking_id": payment_data.booking_id})
    if existing_payment and existing_payment.get("status") == "success":
        raise HTTPException(status_code=400, detail="Payment already completed for this booking")
    
    # Generate unique transaction reference
    tx_ref = f"WRS-{payment_data.booking_id}-{uuid.uuid4().hex[:8]}"
    
    # Get house details for callback URL
    house = await db.houses.find_one({"house_id": booking["house_id"]})
    
    # Split full name for Chapa
    name_parts = current_user["full_name"].split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Prepare callback URL (frontend will handle the redirect)
    callback_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + f"/payment/callback?tx_ref={tx_ref}"
    
    try:
        # Initialize payment with Chapa
        chapa_response = chapa_service.initialize_payment(
            amount=payment_data.amount,
            currency=payment_data.currency,
            tx_ref=tx_ref,
            callback_url=callback_url,
            email=current_user["email"],
            first_name=first_name,
            last_name=last_name,
            phone_number=current_user.get("phone_number")
        )
        
        # Store payment record
        payment_doc = {
            "payment_id": str(uuid.uuid4()),
            "booking_id": payment_data.booking_id,
            "tenant_id": current_user["user_id"],
            "house_id": booking["house_id"],
            "tx_ref": tx_ref,
            "amount": payment_data.amount,
            "currency": payment_data.currency,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payments.insert_one(payment_doc)
        
        return PaymentInitResponse(
            checkout_url=chapa_response["data"]["checkout_url"],
            tx_ref=tx_ref
        )
    except Exception as e:
        logger.error(f"Payment initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payment/verify/{tx_ref}")
async def verify_payment(
    tx_ref: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify payment status with Chapa"""
    
    # Find payment record
    payment = await db.payments.find_one({"tx_ref": tx_ref})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    # Verify user has access to this payment
    if payment["tenant_id"] != current_user["user_id"] and current_user["role"] not in ["admin", "landlord"]:
        raise HTTPException(status_code=403, detail="Not authorized to verify this payment")
    
    try:
        # Verify with Chapa
        chapa_response = chapa_service.verify_payment(tx_ref)
        
        if chapa_response["status"] == "success" and chapa_response["data"]["status"] == "success":
            # Update payment status
            await db.payments.update_one(
                {"tx_ref": tx_ref},
                {"$set": {
                    "status": "success",
                    "verified_at": datetime.now(timezone.utc).isoformat(),
                    "chapa_response": chapa_response["data"]
                }}
            )
            
            # Update booking to mark deposit as paid
            await db.bookings.update_one(
                {"booking_id": payment["booking_id"]},
                {"$set": {"deposit_paid": True}}
            )
            
            return {
                "status": "success",
                "message": "Payment verified successfully",
                "data": chapa_response["data"]
            }
        else:
            # Payment failed
            await db.payments.update_one(
                {"tx_ref": tx_ref},
                {"$set": {
                    "status": "failed",
                    "verified_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            return {
                "status": "failed",
                "message": "Payment verification failed"
            }
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ SAVED HOUSES ROUTES ============

@api_router.post("/tenant/save-house/{house_id}")
async def save_house(
    house_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Save/favorite a house"""
    await require_role(current_user, ["tenant"])
    
    # Check if house exists
    house = await db.houses.find_one({"house_id": house_id})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    # Check if already saved
    existing = await db.saved_houses.find_one({
        "tenant_id": current_user["user_id"],
        "house_id": house_id
    })
    
    if existing:
        # Unsave (toggle behavior)
        await db.saved_houses.delete_one({
            "tenant_id": current_user["user_id"],
            "house_id": house_id
        })
        return {"message": "House removed from favorites", "saved": False}
    else:
        # Save house
        saved_doc = {
            "saved_id": str(uuid.uuid4()),
            "tenant_id": current_user["user_id"],
            "house_id": house_id,
            "saved_at": datetime.now(timezone.utc).isoformat()
        }
        await db.saved_houses.insert_one(saved_doc)
        return {"message": "House added to favorites", "saved": True}

@api_router.get("/tenant/saved-houses", response_model=List[House])
async def get_saved_houses(current_user: dict = Depends(get_current_user)):
    """Get all saved houses for current tenant"""
    await require_role(current_user, ["tenant"])
    
    # Get saved house IDs
    saved_records = await db.saved_houses.find(
        {"tenant_id": current_user["user_id"]},
        {"_id": 0, "house_id": 1}
    ).to_list(1000)
    
    house_ids = [record["house_id"] for record in saved_records]
    
    if not house_ids:
        return []
    
    # Fetch house details
    houses = await db.houses.find(
        {"house_id": {"$in": house_ids}},
        {"_id": 0}
    ).to_list(1000)
    
    return houses

@api_router.get("/tenant/is-saved/{house_id}")
async def check_if_saved(
    house_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if a house is saved by current tenant"""
    await require_role(current_user, ["tenant"])
    
    saved = await db.saved_houses.find_one({
        "tenant_id": current_user["user_id"],
        "house_id": house_id
    })
    
    return {"saved": saved is not None}

# ============ LANDLORD ANALYTICS ROUTES ============

@api_router.get("/landlord/analytics", response_model=LandlordAnalytics)
async def get_landlord_analytics(current_user: dict = Depends(get_current_user)):
    """Get analytics for landlord dashboard"""
    await require_role(current_user, ["landlord"])
    
    # Count total properties
    total_properties = await db.houses.count_documents({"landlord_id": current_user["user_id"]})
    
    # Count bookings
    pending_bookings = await db.bookings.count_documents({
        "landlord_id": current_user["user_id"],
        "status": "pending"
    })
    
    approved_bookings = await db.bookings.count_documents({
        "landlord_id": current_user["user_id"],
        "status": "approved"
    })
    
    # Calculate total revenue from rented properties
    rented_houses = await db.houses.find(
        {"landlord_id": current_user["user_id"], "status": "rented"},
        {"_id": 0, "price_per_month": 1}
    ).to_list(1000)
    
    total_revenue = sum(house.get("price_per_month", 0) for house in rented_houses)
    
    # For views, we'll use a placeholder since we haven't implemented view tracking
    # In a real app, you'd track this with each house view
    total_views = total_properties * 10  # Placeholder calculation
    
    return LandlordAnalytics(
        total_properties=total_properties,
        total_views=total_views,
        pending_bookings=pending_bookings,
        approved_bookings=approved_bookings,
        total_revenue=total_revenue
    )

# ============ ADMIN ROUTES ============

@api_router.get("/admin/stats", response_model=AdminStatsResponse)
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["admin"])
    
    total_users = await db.users.count_documents({})
    total_houses = await db.houses.count_documents({})
    pending_houses = await db.houses.count_documents({"status": "pending_approval"})
    total_bookings = await db.bookings.count_documents({})
    
    return AdminStatsResponse(
        total_users=total_users,
        total_houses=total_houses,
        pending_houses=pending_houses,
        total_bookings=total_bookings
    )

@api_router.get("/admin/pending-houses", response_model=List[House])
async def get_pending_houses(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["admin"])
    
    houses = await db.houses.find(
        {"status": "pending_approval"},
        {"_id": 0}
    ).to_list(1000)
    
    return houses

@api_router.put("/admin/houses/{house_id}/status")
async def update_house_status(
    house_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    await require_role(current_user, ["admin"])
    
    if status not in ["available", "pending_approval", "rented", "hidden"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    house = await db.houses.find_one({"house_id": house_id})
    if not house:
        raise HTTPException(status_code=404, detail="House not found")
    
    await db.houses.update_one(
        {"house_id": house_id},
        {"$set": {"status": status}}
    )
    
    return {"message": "House status updated successfully"}

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    await require_role(current_user, ["admin"])
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    # Create default admin user if not exists
    admin_exists = await db.users.find_one({"email": "admin@woliso.com"})
    if not admin_exists:
        admin_doc = {
            "user_id": str(uuid.uuid4()),
            "email": "admin@woliso.com",
            "password_hash": hash_password("Admin@123"),
            "full_name": "System Administrator",
            "phone_number": "+251-000-0000",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin user created: admin@woliso.com / Admin@123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
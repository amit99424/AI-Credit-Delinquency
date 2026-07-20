from pydantic import BaseModel
import pandas as pd
import joblib
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, HTTPException, Header

import db_models
from database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import os
from dotenv import load_dotenv


# ==========================================
# Load Machine Learning Model
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "random_forest_model.pkl"

model = joblib.load(MODEL_PATH)

print("Random Forest model loaded successfully!")


# ==========================================
# Create Database Tables
# ==========================================

db_models.Base.metadata.create_all(bind=engine)


# ==========================================
# FastAPI Application
# ==========================================

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://ai-credit-delinquency.vercel.app",
]



app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# JWT Configuration
# ==========================================

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ==========================================
# Schemas
# ==========================================

class CustomerCreate(BaseModel):
    name: str
    email: str
    age: int
    credit_limit: float

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    
class UserLogin(BaseModel):
    email: str
    password: str

class CustomerData(BaseModel):

    # Customer ID from database
    customer_id: int

    # ML Model Features
    LIMIT_BAL: float
    SEX: int
    EDUCATION: int
    MARRIAGE: int
    AGE: int

    PAY_0: int
    PAY_2: int
    PAY_3: int
    PAY_4: int
    PAY_5: int
    PAY_6: int

    BILL_AMT1: float
    BILL_AMT2: float
    BILL_AMT3: float
    BILL_AMT4: float
    BILL_AMT5: float
    BILL_AMT6: float

    PAY_AMT1: float
    PAY_AMT2: float
    PAY_AMT3: float
    PAY_AMT4: float
    PAY_AMT5: float
    PAY_AMT6: float

class BulkCustomerData(BaseModel):
    name: str
    email: str

    LIMIT_BAL: float
    SEX: int
    EDUCATION: int
    MARRIAGE: int
    AGE: int

    PAY_0: int
    PAY_2: int
    PAY_3: int
    PAY_4: int
    PAY_5: int
    PAY_6: int

    BILL_AMT1: float
    BILL_AMT2: float
    BILL_AMT3: float
    BILL_AMT4: float
    BILL_AMT5: float
    BILL_AMT6: float

    PAY_AMT1: float
    PAY_AMT2: float
    PAY_AMT3: float
    PAY_AMT4: float
    PAY_AMT5: float
    PAY_AMT6: float
    
class BulkPredictionRequest(BaseModel):
    customers: list[BulkCustomerData]

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
        
# ==========================================
# User Signup
# ==========================================

@app.post("/signup")
def signup(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = (
        db.query(db_models.User)
        .filter(db_models.User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    # Hash password
    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Create new user
    new_user = db_models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email
        }
    }


# ==========================================
# User Login
# ==========================================

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    # Find user by email
    existing_user = (
        db.query(db_models.User)
        .filter(db_models.User.email == user.email)
        .first()
    )

    # Check user exists
    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Check password
    password_valid = bcrypt.checkpw(
        user.password.encode("utf-8"),
        existing_user.hashed_password.encode("utf-8")
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token({
        "sub": str(existing_user.id),
        "email": existing_user.email
    })

    return {
        "status": "success",
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email
        }
    }

# ==========================================
# Home
# ==========================================

@app.get("/")
def home():

    return {
        "status": "success",
        "message": "Credit Delinquency API is running"
    }


# ==========================================
# Database Test
# ==========================================

@app.get("/database-test")
def database_test():

    try:

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "message": "PostgreSQL database connected successfully"
        }

    except Exception as e:

        return {
            "status": "error",
            "message": str(e)
        }


# ==========================================
# Create Customer
# ==========================================

@app.post("/customers")
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):

    # Check if customer email already exists
    existing_customer = (
        db.query(db_models.Customer)
        .filter(db_models.Customer.email == customer.email)
        .first()
    )

    if existing_customer:

        raise HTTPException(
            status_code=400,
            detail="Customer with this email already exists"
        )

    # Create new customer
    new_customer = db_models.Customer(
        name=customer.name,
        email=customer.email,
        age=customer.age,
        credit_limit=customer.credit_limit
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return {
        "status": "success",
        "message": "Customer created successfully",
        "customer": {
            "id": new_customer.id,
            "name": new_customer.name,
            "email": new_customer.email,
            "age": new_customer.age,
            "credit_limit": new_customer.credit_limit
        }
    }


# ==========================================
# Get All Customers
# ==========================================

@app.get("/customers")
def get_customers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):

    customers = db.query(
        db_models.Customer
    ).all()

    return {
        "status": "success",
        "total_customers": len(customers),

        "customers": [
            {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "age": customer.age,
                "credit_limit": customer.credit_limit,
                "created_at": customer.created_at
            }

            for customer in customers
        ]
    }


# ==========================================
# AI Credit Risk Prediction
# ==========================================

@app.post("/predict")
def predict_credit_risk(
    customer: CustomerData,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    try:
        # Check customer exists
        existing_customer = (
            db.query(db_models.Customer)
            .filter(db_models.Customer.id == customer.customer_id)
            .first()
        )

        if not existing_customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found"
            )

        # Prepare ML input
        customer_data = customer.model_dump()

        # Remove customer_id because model was not trained with it
        customer_data.pop("customer_id")

        input_data = pd.DataFrame([customer_data])

        # AI Prediction
        probability = model.predict_proba(input_data)[0][1]
        prediction_value = model.predict(input_data)[0]

        # Risk classification
        if probability < 0.30:
            risk_level = "LOW RISK"
        elif probability < 0.60:
            risk_level = "MEDIUM RISK"
        else:
            risk_level = "HIGH RISK"

        prediction_text = (
            "Likely to default"
            if prediction_value == 1
            else "Unlikely to default"
        )

        # Save prediction in PostgreSQL
        new_prediction = db_models.Prediction(
            customer_id=customer.customer_id,
            default_probability=round(float(probability) * 100, 2),
            risk_level=risk_level,
            prediction=prediction_text
        )

        db.add(new_prediction)
        db.commit()
        db.refresh(new_prediction)

        return {
            "status": "success",
            "prediction_id": new_prediction.id,
            "customer": {
                "id": existing_customer.id,
                "name": existing_customer.name
            },
            "default_probability": round(
                float(probability) * 100,
                2
            ),
            "risk_level": risk_level,
            "prediction": prediction_text,
            "message": "Prediction saved successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "error_type": type(e).__name__,
            "error": str(e)
        }

    # --------------------------------------
    # API Response
    # --------------------------------------

    return {

        "status": "success",

        "prediction_id": new_prediction.id,

        "customer": {
            "id": existing_customer.id,
            "name": existing_customer.name
        },

        "default_probability": round(
            probability * 100,
            2
        ),

        "risk_level": risk_level,

        "prediction": prediction_text,

        "message": "Prediction saved successfully"
    }
    
# ==========================================
# Get Predictions - Pagination + Optimized
# ==========================================

@app.get("/predictions")
def get_predictions(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    # Validate page
    if page < 1:
        page = 1

    # Limit maximum records per request
    if limit < 1:
        limit = 50

    if limit > 100:
        limit = 100

    # ==========================================
    # Get Total Prediction Count
    # ==========================================

    total_predictions = (
        db.query(db_models.Prediction)
        .count()
    )

    # Calculate total pages
    total_pages = (
        total_predictions + limit - 1
    ) // limit

    # Calculate offset
    offset = (page - 1) * limit

    # ==========================================
    # Get Only Current Page Records
    # Single JOIN Query
    # ==========================================

    records = (
        db.query(
            db_models.Prediction,
            db_models.Customer
        )
        .outerjoin(
            db_models.Customer,
            db_models.Prediction.customer_id
            == db_models.Customer.id
        )
        .order_by(
            db_models.Prediction.id.desc()
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    # ==========================================
    # Format Results
    # ==========================================

    results = []

    for prediction, customer in records:

        results.append({
            "prediction_id": prediction.id,

            "customer_id":
                prediction.customer_id,

            "customer_name":
                customer.name
                if customer
                else "Unknown Customer",

            "customer_email":
                customer.email
                if customer
                else "N/A",

            "default_probability":
                prediction.default_probability,

            "risk_level":
                prediction.risk_level,

            "prediction":
                prediction.prediction,

            "created_at":
                prediction.created_at.isoformat()
                if prediction.created_at
                else None
        })

    # ==========================================
    # Response
    # ==========================================

    return {
        "status": "success",

        "total_predictions":
            total_predictions,

        "current_page":
            page,

        "total_pages":
            total_pages,

        "limit":
            limit,

        "predictions":
            results
    }

# ==========================================
# Optimized Bulk AI Credit Risk Prediction
# Maximum 500 Customers
# ==========================================

@app.post("/predict/bulk")
def bulk_predict_credit_risk(
    request: BulkPredictionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    try:
        customers = request.customers

        # ==========================================
        # Validation
        # ==========================================

        if not customers:
            raise HTTPException(
                status_code=400,
                detail="No customer data provided"
            )

        if len(customers) > 500:
            raise HTTPException(
                status_code=400,
                detail="Maximum 500 customers allowed per bulk prediction"
            )

        # ==========================================
        # Prepare Customer Data
        # ==========================================

        customer_records = []
        ml_records = []

        for customer in customers:
            data = customer.model_dump()

            customer_name = data.pop("name")
            customer_email = data.pop("email")

            customer_records.append({
                "name": customer_name,
                "email": customer_email,
                "age": data["AGE"],
                "credit_limit": data["LIMIT_BAL"]
            })

            # Only ML features
            ml_records.append(data)

        # ==========================================
        # Batch AI Prediction
        # Model Called Only Once
        # ==========================================

        input_data = pd.DataFrame(ml_records)

        probabilities = model.predict_proba(
            input_data
        )[:, 1]

        predictions = model.predict(
            input_data
        )

        # ==========================================
        # Get Existing Customers in One Query
        # ==========================================

        emails = [
            record["email"]
            for record in customer_records
        ]

        existing_customers = (
            db.query(db_models.Customer)
            .filter(
                db_models.Customer.email.in_(emails)
            )
            .all()
        )

        # Create email → customer map
        customer_map = {
            customer.email: customer
            for customer in existing_customers
        }

        # ==========================================
        # Create New Customers
        # ==========================================

        new_customers = []

        for record in customer_records:

            if record["email"] not in customer_map:

                new_customer = db_models.Customer(
                    name=record["name"],
                    email=record["email"],
                    age=record["age"],
                    credit_limit=record["credit_limit"]
                )

                new_customers.append(
                    new_customer
                )

        # Add all new customers
        if new_customers:

            db.add_all(
                new_customers
            )

            # Generate database IDs
            db.flush()

            # Add new customers to map
            for customer in new_customers:

                customer_map[
                    customer.email
                ] = customer

        # ==========================================
        # Prepare Prediction Results
        # ==========================================

        results = []

        prediction_objects = []

        for index, record in enumerate(
            customer_records
        ):

            customer = customer_map[
                record["email"]
            ]

            probability = float(
                probabilities[index]
            )

            prediction_value = int(
                predictions[index]
            )

            # ======================================
            # Risk Classification
            # ======================================

            if probability < 0.30:

                risk_level = "LOW RISK"

            elif probability < 0.60:

                risk_level = "MEDIUM RISK"

            else:

                risk_level = "HIGH RISK"

            # ======================================
            # Prediction Text
            # ======================================

            prediction_text = (
                "Likely to default"
                if prediction_value == 1
                else "Unlikely to default"
            )

            probability_percentage = round(
                probability * 100,
                2
            )

            # ======================================
            # Create Prediction Object
            # ======================================

            prediction_object = (
                db_models.Prediction(
                    customer_id=customer.id,
                    default_probability=probability_percentage,
                    risk_level=risk_level,
                    prediction=prediction_text
                )
            )

            prediction_objects.append(
                prediction_object
            )

            # ======================================
            # API Result
            # ======================================

            results.append({
                "customer_id":
                    customer.id,

                "customer_name":
                    customer.name,

                "customer_email":
                    customer.email,

                "default_probability":
                    probability_percentage,

                "risk_level":
                    risk_level,

                "prediction":
                    prediction_text
            })

        # ==========================================
        # Bulk Save Predictions
        # ==========================================

        db.add_all(
            prediction_objects
        )

        # Only one database commit
        db.commit()

        # ==========================================
        # Calculate Summary
        # ==========================================

        low_risk = sum(
            result["risk_level"] == "LOW RISK"
            for result in results
        )

        medium_risk = sum(
            result["risk_level"] == "MEDIUM RISK"
            for result in results
        )

        high_risk = sum(
            result["risk_level"] == "HIGH RISK"
            for result in results
        )

        likely_default = sum(
            result["prediction"]
            == "Likely to default"
            for result in results
        )

        unlikely_default = (
            len(results)
            - likely_default
        )

        # ==========================================
        # Response
        # ==========================================

        return {
            "status": "success",

            "message":
                "Bulk prediction completed successfully",

            "summary": {
                "total_customers":
                    len(results),

                "low_risk":
                    low_risk,

                "medium_risk":
                    medium_risk,

                "high_risk":
                    high_risk,

                "likely_to_default":
                    likely_default,

                "unlikely_to_default":
                    unlikely_default
            },

            "results":
                results
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
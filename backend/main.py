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

app = FastAPI(
    title="AI Credit Delinquency Prediction API"
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
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
# Get All Prediction History
# ==========================================

@app.get("/predictions")
def get_predictions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    predictions = (
        db.query(
            db_models.Prediction,
            db_models.Customer
        )
        .join(
            db_models.Customer,
            db_models.Prediction.customer_id == db_models.Customer.id
        )
        .order_by(
            db_models.Prediction.created_at.desc()
        )
        .all()
    )

    return {
        "status": "success",
        "total_predictions": len(predictions),
        "predictions": [
            {
                "prediction_id": prediction.id,
                "customer_id": customer.id,
                "customer_name": customer.name,
                "customer_email": customer.email,
                "default_probability": prediction.default_probability,
                "risk_level": prediction.risk_level,
                "prediction": prediction.prediction,
                "created_at": prediction.created_at
            }
            for prediction, customer in predictions
        ]
    }
    
@app.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):
    try:
        # Check existing user
        existing_user = (
            db.query(db_models.User)
            .filter(db_models.User.email == user.email)
            .first()
        )

        if existing_user:
            return {
                "status": "error",
                "message": "User with this email already exists"
            }
            
                # Hash password
        password_bytes = user.password.encode("utf-8")

        hashed_password = bcrypt.hashpw(
            password_bytes,
            bcrypt.gensalt()
        ).decode("utf-8")

        # Create new user
        new_user = db_models.User(
            name=user.name,
            email=user.email,
            hashed_password=hashed_password,
            role="admin"
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
                "email": new_user.email,
                "role": new_user.role
            }
        }

    except Exception as e:
        db.rollback()

        return {
            "status": "error",
            "message": str(e)
        }
        
@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    # Find user by email
    existing_user = (
        db.query(db_models.User)
        .filter(db_models.User.email == user.email)
        .first()
    )

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

    # Generate JWT token
    access_token = create_access_token({
        "sub": str(existing_user.id),
        "email": existing_user.email,
        "role": existing_user.role
    })

    return {
        "status": "success",
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": existing_user.id,
            "name": existing_user.name,
            "email": existing_user.email,
            "role": existing_user.role
        }
    }

@app.get("/protected")
def protected_route(
    current_user: dict = Depends(verify_token)
):
    return {
        "status": "success",
        "message": "You have access to this protected route",
        "user": current_user
    }
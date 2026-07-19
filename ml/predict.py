import pandas as pd
import joblib

# Load model
model = joblib.load("models/random_forest_model.pkl")

# Load dataset
df = pd.read_excel(
    "dataset/default of credit card clients.xls",
    header=1
)

# Select one customer
customer = df.drop(
    columns=["ID", "default payment next month"]
).iloc[[0]]

# Predict
prediction = model.predict(customer)[0]
probability = model.predict_proba(customer)[0][1]

# Risk level
if probability < 0.30:
    risk_level = "LOW RISK"
elif probability < 0.60:
    risk_level = "MEDIUM RISK"
else:
    risk_level = "HIGH RISK"

print("\n--- Credit Delinquency Prediction ---")
print(f"Default Probability: {probability * 100:.2f}%")
print(f"Risk Level: {risk_level}")

if prediction == 1:
    print("Prediction: Likely to default")
else:
    print("Prediction: Unlikely to default")
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)

# 1. Load dataset
df = pd.read_excel(
    "dataset/default of credit card clients.xls",
    header=1
)

# 2. Remove ID because it does not help prediction
df = df.drop(columns=["ID"])

# 3. Separate features and target
X = df.drop(columns=["default payment next month"])
y = df["default payment next month"]

# 4. Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 5. Scale features
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 6. Create model
model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

# 7. Train model
print("Training model...")

model.fit(X_train_scaled, y_train)

print("Model training completed!")

# 8. Make predictions
y_pred = model.predict(X_test_scaled)
y_probability = model.predict_proba(X_test_scaled)[:, 1]

# 9. Evaluate
accuracy = accuracy_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_probability)

print("\nAccuracy:")
print(accuracy)

print("\nROC-AUC Score:")
print(roc_auc)

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# 10. Save model and scaler
joblib.dump(model, "models/logistic_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

print("\nModel saved successfully!")
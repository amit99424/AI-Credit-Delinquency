import pandas as pd

# Load dataset
file_path = "dataset/default of credit card clients.xls"

df = pd.read_excel(
    file_path,
    header=1
)

print("Dataset loaded successfully!")

print("\nDataset Shape:")
print(df.shape)

print("\nFirst 5 Rows:")
print(df.head())

print("\nColumn Names:")
print(df.columns.tolist())

print("\nMissing Values:")
print(df.isnull().sum())
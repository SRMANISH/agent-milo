import json
import pandas as pd
import pickle
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

with open("../server/data/property_basics.json") as f1, open("../server/data/property_characteristics.json") as f2:
    price_data = {item['id']: item for item in json.load(f1)}
    detail_data = {item['id']: item for item in json.load(f2)}

merged = []
for i in price_data:
    if i in detail_data:
        merged.append({
            "location": price_data[i]["location"],
            "price": price_data[i]["price"],
            "bedrooms": detail_data[i]["bedrooms"],
            "bathrooms": detail_data[i]["bathrooms"],
            "size_sqft": detail_data[i]["size_sqft"]
        })

df = pd.DataFrame(merged)

X = df.drop("price", axis=1)
y = df["price"]

preprocessor = ColumnTransformer([
    ("location", OneHotEncoder(handle_unknown="ignore"), ["location"])
], remainder="passthrough")

model = Pipeline([
    ("preprocessor", preprocessor),
    ("regressor", LinearRegression())
])

model.fit(X, y)

with open("real_price_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model trained and saved as real_price_model.pkl")

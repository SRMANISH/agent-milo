import sys
import pickle
import pandas as pd

import os

model_path = os.path.join(os.path.dirname(__file__), "real_price_model.pkl")
with open(model_path, "rb") as f:
        model = pickle.load(f)

location = sys.argv[1]
area = float(sys.argv[2])
bedrooms = int(sys.argv[3])
bathrooms = int(sys.argv[4])

input_df = pd.DataFrame([{
    "location": location,
    "size_sqft": area,
    "bedrooms": bedrooms,
    "bathrooms": bathrooms
}])

price = model.predict(input_df)[0]
print(price)

from bson import ObjectId
import datetime
from config.db import db

class PredictionModel:
    def __init__(self):
        self.collection = db.get_collection('predictions')
    
    def create_prediction(self, prediction_data):
        prediction_data['created_at'] = datetime.datetime.utcnow()
        result = self.collection.insert_one(prediction_data)
        return str(result.inserted_id)
    
    def get_user_predictions(self, user_id, limit=10):
        predictions = self.collection.find(
            {'user_id': user_id}
        ).sort('created_at', -1).limit(limit)
        
        return list(predictions)

prediction_model = PredictionModel()

from bson import ObjectId
import datetime
from config.db import db

class UserModel:
    def __init__(self):
        self.collection = db.get_collection('users')
    
    def create_user(self, user_data):
        user_data['created_at'] = datetime.datetime.utcnow()
        result = self.collection.insert_one(user_data)
        return str(result.inserted_id)
    
    def find_by_email(self, email):
        return self.collection.find_one({'email': email})
    
    def find_by_id(self, user_id):
        return self.collection.find_one({'_id': ObjectId(user_id)})
    
    def update_user(self, user_id, update_data):
        result = self.collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    
    def change_password(self, user_id, new_password):
        return self.update_user(user_id, {'password': new_password})

user_model = UserModel()
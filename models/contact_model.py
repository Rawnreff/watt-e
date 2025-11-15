from bson import ObjectId
import datetime
from config.db import db

class ContactModel:
    def __init__(self):
        self.collection = db.get_collection('contact_messages')
    
    def create_message(self, message_data):
        message_data['created_at'] = datetime.datetime.utcnow()
        message_data['status'] = 'new'  # new, read, replied
        result = self.collection.insert_one(message_data)
        return str(result.inserted_id)
    
    def find_by_id(self, message_id):
        return self.collection.find_one({'_id': ObjectId(message_id)})
    
    def get_all_messages(self, limit=100):
        messages = self.collection.find().sort('created_at', -1).limit(limit)
        return list(messages)
    
    def update_status(self, message_id, status):
        result = self.collection.update_one(
            {'_id': ObjectId(message_id)},
            {'$set': {'status': status}}
        )
        return result.modified_count > 0

contact_model = ContactModel()



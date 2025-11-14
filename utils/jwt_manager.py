import jwt
import datetime
from dotenv import load_dotenv
import os

load_dotenv()

class JWTManager:
    def __init__(self):
        self.secret = os.getenv('JWT_SECRET')
    
    def generate_token(self, user_id):
        payload = {
            'user_id': str(user_id),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }
        return jwt.encode(payload, self.secret, algorithm='HS256')
    
    def verify_token(self, token):
        try:
            payload = jwt.decode(token, self.secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

jwt_manager = JWTManager()
from flask import request, jsonify
from utils.jwt_manager import jwt_manager

def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        payload = jwt_manager.verify_token(token)
        if not payload:
            return jsonify({'message': 'Token is invalid or expired'}), 401
        
        request.user_id = payload['user_id']
        return f(*args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated
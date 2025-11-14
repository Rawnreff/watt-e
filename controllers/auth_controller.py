from flask import Blueprint, request, jsonify
import bcrypt
from models.user_model import user_model
from utils.jwt_manager import jwt_manager

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'email', 'password', 'golongan_pln']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if user already exists
        if user_model.find_by_email(data['email']):
            return jsonify({'message': 'User already exists'}), 409
        
        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user_data = {
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password.decode('utf-8'),
            'golongan_pln': data['golongan_pln']
        }
        
        user_id = user_model.create_user(user_data)
        
        # Generate token
        token = jwt_manager.generate_token(user_id)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {
                'id': user_id,
                'name': data['name'],
                'email': data['email'],
                'golongan_pln': data['golongan_pln']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        user = user_model.find_by_email(data['email'])
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Verify password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Generate token
        token = jwt_manager.generate_token(str(user['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'golongan_pln': user['golongan_pln']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
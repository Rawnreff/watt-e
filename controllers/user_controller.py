from flask import Blueprint, request, jsonify
import bcrypt
from middleware.auth_middleware import token_required
from models.user_model import user_model

user_bp = Blueprint('user', __name__)

@user_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    try:
        user = user_model.find_by_id(request.user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'golongan_pln': user['golongan_pln'],
                'created_at': user['created_at'].isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@user_bp.route('/update', methods=['PATCH'])
@token_required
def update_user():
    try:
        data = request.get_json()
        allowed_fields = ['name', 'golongan_pln']
        
        update_data = {}
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            success = user_model.update_user(request.user_id, update_data)
            if success:
                return jsonify({'message': 'User updated successfully'}), 200
            else:
                return jsonify({'message': 'No changes made'}), 400
        
        return jsonify({'message': 'No valid fields to update'}), 400
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@user_bp.route('/change-password', methods=['PATCH'])
@token_required
def change_password():
    try:
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'message': 'Current password and new password are required'}), 400
        
        user = user_model.find_by_id(request.user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Verify current password
        if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        # Hash new password
        hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt())
        
        # Update password
        success = user_model.change_password(request.user_id, hashed_password.decode('utf-8'))
        if success:
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'message': 'Failed to change password'}), 500
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
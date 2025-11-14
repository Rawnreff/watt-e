from flask import Blueprint, request, jsonify

from models.contact_model import contact_model

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/send', methods=['POST'])
def send_message():
    try:
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate email format
        if '@' not in data['email']:
            return jsonify({'message': 'Invalid email format'}), 400
        
        # Create message
        message_data = {
            'name': data['name'],
            'email': data['email'],
            'subject': data['subject'],
            'message': data['message']
        }
        
        message_id = contact_model.create_message(message_data)
        
        return jsonify({
            'message': 'Pesan berhasil dikirim',
            'message_id': message_id
        }), 201
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500


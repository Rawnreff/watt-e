from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required
from models.user_model import user_model
from models.prediction_model import prediction_model
from utils.gemini_client import gemini_client

prediction_bp = Blueprint('prediction', __name__)

@prediction_bp.route('/ai', methods=['POST'])
@token_required
def predict_consumption():
    try:
        data = request.get_json()
        
        if not data.get('kwh_last_month'):
            return jsonify({'message': 'kwh_last_month is required'}), 400
        
        # Get user data
        user = user_model.find_by_id(request.user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get prediction from Gemini
        prediction_result = gemini_client.predict_consumption(
            data['kwh_last_month'],
            user['golongan_pln'],
            f"User: {user['name']}"
        )
        
        # Save prediction to database
        prediction_data = {
            'user_id': request.user_id,
            'kwh_last_month': data['kwh_last_month'],
            'golongan_pln': user['golongan_pln'],
            'prediction_result': prediction_result
        }
        
        prediction_id = prediction_model.create_prediction(prediction_data)
        
        return jsonify({
            'message': 'Prediction generated successfully',
            'prediction_id': prediction_id,
            'prediction': prediction_result
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@prediction_bp.route('/history/me', methods=['GET'])
@token_required
def get_prediction_history():
    try:
        predictions = prediction_model.get_user_predictions(request.user_id)
        
        # Convert ObjectId to string and format dates
        formatted_predictions = []
        for pred in predictions:
            formatted_pred = {
                'id': str(pred['_id']),
                'kwh_last_month': pred['kwh_last_month'],
                'golongan_pln': pred['golongan_pln'],
                'prediction': pred['prediction_result'],
                'created_at': pred['created_at'].isoformat()
            }
            formatted_predictions.append(formatted_pred)
        
        return jsonify({
            'predictions': formatted_predictions
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
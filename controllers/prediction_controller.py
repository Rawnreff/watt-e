from flask import Blueprint, request, jsonify
import datetime
from middleware.auth_middleware import token_required
from models.user_model import user_model
from models.prediction_model import prediction_model
from utils.gemini_client2 import gemini_client

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
        
        # Determine which golongan to use: prefer request payload (frontend may send numeric/code), fallback to user's stored value
        golongan_to_use = data.get('golongan_pln') or user.get('golongan_pln')

        # Determine target/current month info (we need month_target for history context)
        month_target_raw = data.get('month_target')
        month_target_date = None
        if month_target_raw:
            try:
                # expect format YYYY-MM
                parts = str(month_target_raw).split('-')
                year = int(parts[0])
                month = int(parts[1])
                month_target_date = datetime.date(year, month, 1)
            except Exception:
                month_target_date = None

        if month_target_date is None:
            today = datetime.datetime.utcnow().date()
            # compute next month
            y = today.year + (1 if today.month == 12 else 0)
            m = 1 if today.month == 12 else today.month + 1
            month_target_date = datetime.date(y, m, 1)

        # previous month (current month relative to prediction target)
        if month_target_date.month == 1:
            prev_y = month_target_date.year - 1
            prev_m = 12
        else:
            prev_y = month_target_date.year
            prev_m = month_target_date.month - 1

        month_current_date = datetime.date(prev_y, prev_m, 1)

        month_target_str = month_target_date.strftime('%Y-%m')
        month_current_str = month_current_date.strftime('%Y-%m')

        # Collect recent prediction history (last ~6 months) to provide context to the model
        six_months_ago = datetime.datetime.utcnow() - datetime.timedelta(days=180)
        recent_preds = prediction_model.get_user_predictions_since(request.user_id, six_months_ago)

        # Limit history to the most recent 6 entries (if available)
        recent_sorted_desc = sorted(recent_preds, key=lambda x: x.get('created_at'), reverse=True)
        recent_limited = list(recent_sorted_desc[:6])
        # Build history array for the prompt in chronological order
        history_for_prompt = []
        for rp in reversed(recent_limited):
            entry = {
                'created_at': rp.get('created_at').isoformat() if rp.get('created_at') else None,
                'month_target': rp.get('month_target'),
                'kwh_last_month': rp.get('kwh_last_month'),
                'kwh_prediction': rp.get('kwh_prediction')
            }
            history_for_prompt.append(entry)

        # Include the latest submitted kWh as the most recent data point in the context
        history_for_prompt.append({
            'created_at': datetime.datetime.utcnow().isoformat(),
            'month_target': month_target_str if 'month_target_str' in locals() else None,
            'kwh_last_month': data['kwh_last_month'],
            'kwh_prediction': None
        })

        # Get prediction from Gemini using historical context
        prediction_result = gemini_client.predict(
            history_for_prompt,
            golongan_to_use,
            {
                'user_name': user.get('name'),
                'user_id': request.user_id
            }
        )
        
        

        # Extract numeric kWh prediction if possible and save it as a top-level field
        kwh_pred_raw = prediction_result.get('kwh_prediction') if isinstance(prediction_result, dict) else None
        kwh_pred_val = None
        if kwh_pred_raw is not None:
            try:
                # Normalize common formats like '1.234,56' or '1234.56' or numeric values
                s = str(kwh_pred_raw)
                cleaned = ''.join(ch for ch in s if ch.isdigit() or ch in '.,')
                if cleaned:
                    if cleaned.count(',') > 0 and cleaned.count('.') == 0:
                        cleaned = cleaned.replace(',', '.')
                    # remove thousand separators if multiple dots present
                    if cleaned.count('.') > 1:
                        cleaned = cleaned.replace('.', '')
                    kwh_pred_val = float(cleaned)
            except Exception:
                kwh_pred_val = None

        # Save prediction to database (keep raw prediction_result and add parsed kwh_prediction and month info)
        prediction_data = {
            'user_id': request.user_id,
            'kwh_last_month': data['kwh_last_month'],
            'golongan_pln': golongan_to_use,
            'prediction_result': prediction_result,
            'kwh_prediction': kwh_pred_val,
            'month_current': month_current_str,
            'month_target': month_target_str
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
                'kwh_prediction': pred.get('kwh_prediction'),
                'month_current': pred.get('month_current'),
                'month_target': pred.get('month_target'),
                'created_at': pred['created_at'].isoformat()
            }
            formatted_predictions.append(formatted_pred)
        
        return jsonify({
            'predictions': formatted_predictions
        }), 200
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500
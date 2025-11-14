from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import blueprints
from controllers.auth_controller import auth_bp
from controllers.user_controller import user_bp
from controllers.prediction_controller import prediction_bp
from controllers.contact_controller import contact_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(user_bp, url_prefix='/user')
app.register_blueprint(prediction_bp, url_prefix='/predict')
app.register_blueprint(contact_bp, url_prefix='/contact')

@app.route('/')
def home():
    return jsonify({
        'message': 'Watt-E API is running!',
        'version': '1.0.0'
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
    
    def predict_consumption(self, kwh_last_month, golongan_tarif, user_data=None):
        prompt = f"""
        Sebagai ahli energi listrik, prediksikan penggunaan listrik untuk bulan ini berdasarkan data:
        
        - Penggunaan bulan lalu: {kwh_last_month} kWh
        - Golongan tarif: {golongan_tarif}
        - Data tambahan: {user_data if user_data else 'Tidak ada'}
        
        Berikan prediksi dalam format JSON berikut:
        {{
            "kwh_prediction": "angka prediksi dalam kWh",
            "price_prediction": "perkiraan biaya dalam Rupiah",
            "tips": ["array berisi 3-5 tips hemat energi"],
            "confidence_level": "tingkat kepercayaan prediksi (Tinggi/Medium/Rendah)"
        }}
        
        Hitung berdasarkan pola konsumsi musiman dan karakteristik golongan {golongan_tarif}.
        Berikan tips yang spesifik dan actionable.
        """
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        try:
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                result = response.json()
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Extract JSON from response
                json_start = text_response.find('{')
                json_end = text_response.rfind('}') + 1
                json_str = text_response[json_start:json_end]
                
                return json.loads(json_str)
            else:
                return self.get_fallback_prediction(kwh_last_month, golongan_tarif)
                
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return self.get_fallback_prediction(kwh_last_month, golongan_tarif)
    
    def get_fallback_prediction(self, kwh_last_month, golongan_tarif):
        # Fallback calculation if API fails
        base_multiplier = 1.1  # 10% increase as default
        tariff_rates = {
            "R-1/900": 1352,
            "R-1/1300": 1444.70,
            "R-2/3500": 1699.53
        }
        
        predicted_kwh = kwh_last_month * base_multiplier
        tariff_rate = tariff_rates.get(golongan_tarif, 1444.70)
        predicted_price = predicted_kwh * tariff_rate
        
        return {
            "kwh_prediction": round(predicted_kwh, 2),
            "price_prediction": f"Rp {round(predicted_price, 2):,}",
            "tips": [
                "Gunakan peralatan elektronik secara efisien",
                "Matikan peralatan saat tidak digunakan",
                "Manfaatkan pencahayaan alami di siang hari"
            ],
            "confidence_level": "Medium"
        }

gemini_client = GeminiClient()
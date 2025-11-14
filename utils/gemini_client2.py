"""Clean Gemini client (alternate module).

Provides `gemini_client` instance with `.predict(history_list, golongan_tarif, user_data)`.
"""

import json
from typing import Any, Dict, List, Optional

import requests


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or ""
        self.base_url = base_url or "https://api.example.com/gemini"

    @staticmethod
    def _parse_number(value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            s = str(value).strip()
            cleaned = ''.join(ch for ch in s if ch.isdigit() or ch in '.,')
            if cleaned == '':
                return None
            if cleaned.count(',') > 0 and cleaned.count('.') == 0:
                cleaned = cleaned.replace(',', '.')
            if cleaned.count('.') > 1:
                cleaned = cleaned.replace('.', '')
            return float(cleaned)
        except Exception:
            return None

    @staticmethod
    def _weighted_moving_average(vals: List[float], window: int = 4) -> float:
        if not vals:
            return 0.0
        n = len(vals)
        w = min(window, n)
        weights = list(range(1, w + 1))
        selected = vals[-w:]
        weighted_sum = sum(val * wt for val, wt in zip(selected, weights[::-1]))
        weight_total = sum(weights)
        return weighted_sum / weight_total if weight_total else sum(selected) / len(selected)

    @staticmethod
    def _linear_regression_predict(vals: List[float]) -> float:
        n = len(vals)
        if n == 0:
            return 0.0
        x = list(range(n))
        y = vals
        x_mean = sum(x) / n
        y_mean = sum(y) / n
        num = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, y))
        den = sum((xi - x_mean) ** 2 for xi in x)
        slope = num / den if den != 0 else 0.0
        intercept = y_mean - slope * x_mean
        return intercept + slope * n

    def _deterministic_prediction(self, history_vals: List[float]) -> float:
        if not history_vals:
            return 0.0
        wma = self._weighted_moving_average(history_vals, window=4)
        lin = self._linear_regression_predict(history_vals)
        if len(history_vals) >= 3:
            pred = 0.55 * lin + 0.45 * wma
        else:
            pred = 0.6 * wma + 0.4 * lin
        return max(pred, 0.0)

    def _call_llm(self, prompt: str) -> Optional[str]:
        if not self.api_key or not self.base_url:
            return None
        headers = {"Content-Type": "application/json"}
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        try:
            resp = requests.post(f"{self.base_url}?key={self.api_key}", headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                try:
                    return data['candidates'][0]['content']['parts'][0]['text']
                except Exception:
                    return None
            return None
        except Exception:
            return None

    def predict(self, history_list: Optional[List[Dict[str, Any]]], golongan_tarif: Optional[Any], user_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        history_vals: List[float] = []
        if isinstance(history_list, (list, tuple)):
            for h in history_list:
                if not isinstance(h, dict):
                    continue
                v = self._parse_number(h.get('kwh_prediction'))
                if v is None:
                    v = self._parse_number(h.get('kwh_last_month'))
                if v is not None:
                    history_vals.append(v)

        deterministic = round(self._deterministic_prediction(history_vals), 2)

        lines: List[str] = []
        if history_list:
            for h in history_list[-6:]:
                when = h.get('month_target') or h.get('created_at') or ''
                last = h.get('kwh_last_month')
                pred = h.get('kwh_prediction')
                line = f"- {when}: last_month={last} kWh"
                if pred is not None:
                    line += f", pred={pred} kWh"
                lines.append(line)
        history_block = "\n".join(lines) if lines else "Tidak ada data historis."

        prompt = f"""
Anda adalah seorang ahli energi listrik. Analisis pola penggunaan listrik berdasarkan data historis berikut (urut dari yang lebih lama ke yang terbaru):

{history_block}

Golongan tarif saat ini: {golongan_tarif}
Informasi pengguna: {json.dumps(user_data) if user_data else 'Tidak ada'}

Berdasarkan pola historis di atas, prediksikan penggunaan listrik untuk bulan target (bulan setelah data terbaru).
Berikan hasil dalam format JSON berikut:
{{
    "kwh_prediction": angka_prediksi_dalam_kWh,
    "price_prediction": "perkiraan biaya dalam Rupiah",
    "tips": ["array berisi 3-5 tips hemat energi"],
    "confidence_level": "Tinggi/Medium/Rendah"
}}

Jelaskan singkat asumsi yang digunakan (maksimum 2 kalimat) jika perlu.
"""

        text_resp = self._call_llm(prompt)
        model_kwh: Optional[float] = None
        model_resp: Optional[Dict[str, Any]] = None
        if text_resp:
            try:
                start = text_resp.find("{")
                end = text_resp.rfind("}") + 1
                if start != -1 and end != -1 and end > start:
                    json_str = text_resp[start:end]
                    model_resp = json.loads(json_str)
                    model_kwh = self._parse_number(model_resp.get('kwh_prediction'))
            except Exception:
                model_resp = None

        final_kwh = deterministic
        if model_kwh is not None and model_kwh > 0:
            final_kwh = round((0.65 * deterministic) + (0.35 * model_kwh), 2)

        tariff_rates = {
            "R-1/900": 1352,
            "R-1/1300": 1444.70,
            "R-2/3500": 1699.53
        }

        numeric_rate = self._parse_number(golongan_tarif)
        if numeric_rate and numeric_rate > 0:
            tariff_rate = numeric_rate
        else:
            tariff_rate = tariff_rates.get(str(golongan_tarif), 1444.70)

        predicted_price = final_kwh * tariff_rate

        tips = None
        confidence = None
        if model_resp and isinstance(model_resp, dict):
            tips = model_resp.get('tips')
            confidence = model_resp.get('confidence_level')

        if not tips:
            tips = [
                "Gunakan peralatan elektronik secara efisien",
                "Matikan peralatan saat tidak digunakan",
                "Manfaatkan pencahayaan alami di siang hari"
            ]

        if not confidence:
            confidence = "Medium"

        return {
            "kwh_prediction": float(round(final_kwh, 2)),
            "price_prediction": f"Rp {predicted_price:,.0f}",
            "tips": tips,
            "confidence_level": confidence,
            "deterministic_kwh": float(deterministic),
            "model_kwh": float(model_kwh) if model_kwh is not None else None,
        }


# module-level instance
gemini_client = GeminiClient()

import re
import math
import statistics
from typing import List, Dict, Any, Optional, Union


class DataAnalysisService:
    """
    Deterministic numerical data analysis engine.
    Performs real mathematical calculations on structured datasets, tables, CSV text,
    and extracted metrics. Never hallucinates numbers.
    """

    @classmethod
    def analyze_numeric_series(
        cls,
        values: List[Union[int, float]],
        label: str = "Values",
        unit: str = ""
    ) -> Dict[str, Any]:
        """Calculates exact descriptive statistics for a list of numbers."""
        if not values or len(values) == 0:
            return {
                "status": "insufficient_data",
                "message": "Insufficient data to calculate this reliably.",
                "data_points": 0
            }

        clean_vals = [float(v) for v in values if isinstance(v, (int, float)) and not math.isnan(v)]
        if not clean_vals:
            return {
                "status": "insufficient_data",
                "message": "Insufficient data to calculate this reliably.",
                "data_points": 0
            }

        count = len(clean_vals)
        total_sum = sum(clean_vals)
        mean_val = statistics.mean(clean_vals)
        median_val = statistics.median(clean_vals)
        min_val = min(clean_vals)
        max_val = max(clean_vals)
        range_val = max_val - min_val
        std_dev = statistics.stdev(clean_vals) if count > 1 else 0.0

        # Percentage change from first to last (if sequential series)
        pct_change = None
        if count >= 2 and clean_vals[0] != 0:
            pct_change = ((clean_vals[-1] - clean_vals[0]) / abs(clean_vals[0])) * 100.0

        return {
            "status": "success",
            "label": label,
            "unit": unit,
            "count": count,
            "sum": round(total_sum, 3),
            "mean": round(mean_val, 3),
            "median": round(median_val, 3),
            "min": round(min_val, 3),
            "max": round(max_val, 3),
            "range": round(range_val, 3),
            "std_dev": round(std_dev, 3),
            "percentage_change": round(pct_change, 2) if pct_change is not None else None,
            "values": clean_vals
        }

    @classmethod
    def calculate_growth_rate(
        cls,
        start_value: float,
        end_value: float,
        periods: int = 1
    ) -> Dict[str, Any]:
        """Calculates exact absolute and compound growth rates."""
        if start_value == 0 or periods <= 0:
            return {
                "status": "insufficient_data",
                "message": "Insufficient data to calculate this reliably.",
            }

        abs_diff = end_value - start_value
        pct_growth = (abs_diff / abs(start_value)) * 100.0
        
        # Compound Annual Growth Rate (CAGR) if periods > 1 and positive values
        cagr = None
        if periods > 1 and start_value > 0 and end_value > 0:
            cagr = ((end_value / start_value) ** (1.0 / periods) - 1.0) * 100.0

        return {
            "status": "success",
            "start_value": start_value,
            "end_value": end_value,
            "periods": periods,
            "absolute_change": round(abs_diff, 3),
            "percentage_growth": round(pct_growth, 2),
            "cagr": round(cagr, 2) if cagr is not None else None
        }

    @classmethod
    def parse_csv_or_table(cls, text_data: str) -> Optional[Dict[str, Any]]:
        """Parses CSV text or markdown tables into structured numeric series."""
        lines = [l.strip() for l in text_data.strip().split("\n") if l.strip()]
        if len(lines) < 2:
            return None

        # Check for delimiter (comma, tab, pipe)
        delimiter = ","
        if "|" in lines[0]:
            delimiter = "|"
        elif "\t" in lines[0]:
            delimiter = "\t"

        headers = [h.strip() for h in lines[0].split(delimiter) if h.strip()]
        if not headers:
            return None

        numeric_columns: Dict[str, List[float]] = {h: [] for h in headers}

        for line in lines[1:]:
            if line.startswith("---") or line.startswith("|---"):
                continue
            cells = [c.strip() for c in line.split(delimiter) if c.strip()]
            for idx, cell in enumerate(cells):
                if idx < len(headers):
                    # Try extracting float or int
                    num_match = re.search(r'[-+]?\d+(?:\.\d+)?', cell.replace(",", ""))
                    if num_match:
                        try:
                            val = float(num_match.group(0))
                            numeric_columns[headers[idx]].append(val)
                        except ValueError:
                            pass

        analysis_summary = {}
        for h, vals in numeric_columns.items():
            if len(vals) >= 2:
                analysis_summary[h] = cls.analyze_numeric_series(vals, label=h)

        if not analysis_summary:
            return None

        return {
            "headers": headers,
            "columns_analyzed": list(analysis_summary.keys()),
            "statistics": analysis_summary
        }

    @classmethod
    def extract_numbers_and_compare(cls, text: str) -> Dict[str, Any]:
        """Extracts numerical assertions from text and generates a structured comparison matrix."""
        # Find patterns like "X increased by 15%", "from 100 to 150", "mean of 4.5"
        pct_matches = re.findall(r'(\d+(?:\.\d+)?)\s*%', text)
        measurements = re.findall(r'(\d+(?:\.\d+)?)\s*(?:ms|kb|mb|gb|tb|mhz|ghz|kg|mg|m|km|seconds|hours)', text, re.IGNORECASE)

        results: Dict[str, Any] = {
            "percentages_found": [float(p) for p in pct_matches[:10]],
            "measurements_found": measurements[:10]
        }

        if results["percentages_found"]:
            results["percentage_stats"] = cls.analyze_numeric_series(results["percentages_found"], label="Percentages", unit="%")

        return results

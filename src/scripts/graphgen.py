"""
Generate a graph to test the LineChart component.
"""

import json
import random
import uuid
from datetime import date, timedelta


def generate_data(num_days: int, output_file: str = "graph.nedb"):
    today = date.today()
    data_lines = []

    for i in range(num_days):
        d = today - timedelta(days=i)
        date_int = int(d.strftime("%Y%m%d"))

        entry = {
            "date": date_int,
            "cf": random.randint(0, 5),
            "neps": random.randint(0, 3),
            "leetcode": random.randint(0, 3),
            "timus": random.randint(0, 2),
            "uva": random.randint(0, 2),
            "kattis": random.randint(0, 2),
            "contests": random.randint(0, 1),
            "_id": uuid.uuid4().hex[:16],
        }

        data_lines.append(json.dumps(entry, ensure_ascii=False))

    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(data_lines))

    print(f"📈 File {output_file} generated with {num_days} days.")


if __name__ == "__main__":
    N = int(input("How many days? "))
    generate_data(N)

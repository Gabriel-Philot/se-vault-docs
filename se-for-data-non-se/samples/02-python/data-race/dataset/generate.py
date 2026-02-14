import os
import csv
import random
from datetime import date
from faker import Faker

fake = Faker()

DATA_PATH = os.environ.get("DATA_PATH", "/data/dataset.csv")
NUM_ROWS = 1_000_000

DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Legal", "Support"]


def main():
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    fieldnames = ["id", "name", "city", "department", "salary", "hire_date", "rating", "active"]

    with open(DATA_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i in range(1, NUM_ROWS + 1):
            writer.writerow({
                "id": i,
                "name": fake.name(),
                "city": fake.city(),
                "department": random.choice(DEPARTMENTS),
                "salary": random.randint(30000, 150000),
                "hire_date": fake.date_between(start_date=date(2015, 1, 1), end_date=date(2024, 12, 31)).isoformat(),
                "rating": round(random.uniform(1.0, 5.0), 1),
                "active": random.random() < 0.7,
            })

            if i % 100_000 == 0:
                print(f"Progress: {i:,} / {NUM_ROWS:,} rows written")

    print(f"Done. Dataset saved to {DATA_PATH}")


if __name__ == "__main__":
    main()

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from generate_dataset import FIELDS, generate_dataset


class GenerateDatasetTests(unittest.TestCase):
    def test_generates_requested_rows_and_valid_schema(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            output = Path(temp_dir) / "nested" / "events.csv"
            size = generate_dataset(12, output, seed=7, days=2)

            with output.open(newline="", encoding="utf-8") as stream:
                reader = csv.DictReader(stream)
                rows = list(reader)

            self.assertEqual(reader.fieldnames, FIELDS)
            self.assertEqual(len(rows), 12)
            self.assertGreater(size, 0)
            self.assertTrue(rows[0]["event_id"].startswith("synthetic-"))
            self.assertIn("scenario", json.loads(rows[0]["metadata"]))

    def test_rejects_non_positive_row_count(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaisesRegex(ValueError, "at least 1"):
                generate_dataset(0, Path(temp_dir) / "events.csv")

    def test_same_seed_produces_identical_files(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            first = Path(temp_dir) / "first.csv"
            second = Path(temp_dir) / "second.csv"
            generate_dataset(5, first, seed=19, days=2)
            generate_dataset(5, second, seed=19, days=2)

            self.assertEqual(first.read_bytes(), second.read_bytes())


if __name__ == "__main__":
    unittest.main()

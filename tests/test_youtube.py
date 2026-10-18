import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path
import unittest
from urllib.error import URLError
spec = importlib.util.spec_from_file_location('collector', Path(__file__).resolve().parents[1] / 'scripts/update_youtube.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
NOW = datetime(2026, 10, 17, 16, 23, tzinfo=timezone.utc)

def item(hidden=False):
    return {'id': 'UCtest', 'snippet': {'title': 'Troy Kearns'}, 'statistics':
            {'subscriberCount': '123000', 'viewCount': '987654', 'videoCount': '25', 'hiddenSubscriberCount': hidden}}

class CollectorTests(unittest.TestCase):
    def test_missing_key_does_not_fetch(self):
        def fail(*args): raise AssertionError('No network call without key')
        self.assertEqual(collector.update({}, '', NOW, fail)['status'], 'not_configured')

    def test_hidden_subscriber_count_is_not_zero(self):
        payload = item(True)
        del payload['statistics']['subscriberCount']
        self.assertIsNone(collector.snapshot(payload, NOW)['subscribers'])

    def test_retention_and_future_rows(self):
        rows = [collector.snapshot(item(), NOW + timedelta(days=offset)) for offset in (-28, -26, 0, 1)]
        self.assertEqual(len(collector.prune(rows, NOW)), 2)

    def test_same_day_update_replaces_observation(self):
        old = collector.snapshot(item(), NOW - timedelta(hours=1))
        result = collector.update({'snapshots': [old]}, 'test-key', NOW, lambda *args: item())
        self.assertEqual(len(result['snapshots']), 1)
        self.assertEqual(result['status'], 'ok')
        self.assertEqual(result['snapshots'][0]['observedAt'], NOW.isoformat().replace('+00:00','Z'))

    def test_failure_preserves_recent_data_not_zero(self):
        old = collector.snapshot(item(), NOW - timedelta(days=1))
        def fail(*args): raise URLError('offline')
        result = collector.update({'snapshots': [old]}, 'test-key', NOW, fail)
        self.assertEqual(result['status'], 'update_failed')
        self.assertEqual(result['snapshots'], [old])
        self.assertEqual(result['updatedAt'], old['observedAt'])

    def test_invalid_response_does_not_write_partial_snapshot(self):
        bad = item(); bad['statistics']['viewCount'] = 'NaN'
        result = collector.update({}, 'test-key', NOW, lambda *args: bad)
        self.assertEqual(result['status'], 'update_failed')
        self.assertEqual(result['snapshots'], [])

if __name__ == '__main__': unittest.main()

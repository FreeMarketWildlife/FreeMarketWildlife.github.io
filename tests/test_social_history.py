import importlib.util
from pathlib import Path
from datetime import datetime, timedelta, timezone
import unittest

spec = importlib.util.spec_from_file_location('social_history', Path(__file__).resolve().parents[1] / 'scripts/social_history.py')
history = importlib.util.module_from_spec(spec)
spec.loader.exec_module(history)
NOW = datetime(2026, 10, 18, 7, tzinfo=timezone.utc)
IDENTITY = {'client': 'kat-kai', 'platform': 'youtube', 'account': 'KatandKaiPeakOfficial'}

def at(offset):
    return (NOW + timedelta(days=offset)).isoformat().replace('+00:00', 'Z')

class HistoryTests(unittest.TestCase):
    def record(self, previous=None, offset=0, resources=None, success=True, identity=IDENTITY):
        return history.record(previous or {}, identity, resources if resources is not None else
                              {'video1': {'views': 42, 'likes': None, 'comments': 0}},
                              at(offset), NOW + timedelta(days=offset), success=success)

    def test_daily_retries_replace_and_new_days_append(self):
        first = self.record()
        retry = self.record(first, resources={'video1': {'views': 45}})
        self.assertEqual(len(retry['resources']['video1']), 1)
        following = self.record(retry, 1)
        self.assertEqual([r['metrics']['views'] for r in following['resources']['video1']], [45, 42])

    def test_failure_preserves_counts_without_extending_timestamp(self):
        first = self.record()
        failed = self.record(first, 2, success=False)
        self.assertEqual(first['resources'], failed['resources'])
        self.assertEqual(failed['status'], 'update_failed')

    def test_expiry_runs_even_on_failure(self):
        failed = self.record(self.record(), 28, success=False)
        self.assertEqual(failed['resources'], {})

    def test_no_cross_client_or_platform_history(self):
        first = self.record()
        second = self.record(first, 1, identity={**IDENTITY, 'client': 'other'})
        self.assertEqual(len(second['resources']['video1']), 1)

    def test_missing_days_not_filled(self):
        rows = self.record(self.record(), 4)['resources']['video1']
        self.assertEqual([row['observedAt'] for row in rows], [at(0), at(4)])

    def test_success_removes_deleted_or_nonpublic_resources(self):
        self.assertEqual(self.record(self.record(), 1, resources={})['resources'], {})

    def test_null_is_distinct_from_zero_and_decreases_retained(self):
        first = self.record()
        second = self.record(first, 1, resources={'video1': {'views': 0, 'likes': None}})
        self.assertIsNone(second['resources']['video1'][-1]['metrics']['likes'])
        self.assertEqual(second['resources']['video1'][-1]['metrics']['views'], 0)

    def test_invalid_values_and_future_rows_excluded(self):
        for value in [-1, float('nan'), float('inf'), '42', True]:
            self.assertEqual(history.observations([{'observedAt': at(0), 'metrics': {'views': value}}], NOW, 27), [])
        self.assertEqual(history.observations([{'observedAt': at(1), 'metrics': {'views': 42}}], NOW, 27), [])

    def test_unsafe_resource_and_retention_rejected(self):
        with self.assertRaises(ValueError): self.record(resources={'../escape': {'views': 1}})
        with self.assertRaises(ValueError): history.record({}, IDENTITY, {}, at(0), NOW, retention_days=365)

if __name__ == '__main__': unittest.main()

class YouTubePersistenceTests(unittest.TestCase):
    def test_real_file_round_trip_and_failed_collection(self):
        import tempfile, json, shutil, sys
        from unittest.mock import patch
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
        import update_youtube as collector
        current = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        catalog = {'schemaVersion': 1, 'status': 'ok', 'channelId': 'UCtest', 'updatedAt': current,
                   'videos': [{'id': 'video1', 'statistics': {'viewCount': '100', 'likeCount': '0'}}]}
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'assets/data').mkdir(parents=True)
            with patch.object(collector, 'ROOT', root), patch.object(collector, 'CURRENT_ACCOUNT',
                {**IDENTITY, 'retentionDays': 27}):
                collector.persist_video_history('kat-kai-youtube', catalog)
                resource = root / 'assets/data/history/kat-kai-youtube/video1.json'
                data = json.loads(resource.read_text())
                self.assertEqual(data['observations'][0]['metrics'], {'views': 100, 'likes': 0, 'comments': None})
                # Simulate CI artifact restoration into the next clean runner.
                shutil.copy(root / 'assets/data/kat-kai-youtube-history.json', root / '.youtube-state/kat-kai-youtube-history.json')
                collector.persist_video_history('kat-kai-youtube', {'status': 'update_failed'})
                failed = json.loads(resource.read_text())
                self.assertEqual(failed['observations'], data['observations'])
                self.assertEqual(failed['status'], 'update_failed')
                collector.persist_video_history('kat-kai-youtube', {**catalog, 'videos': []})
                self.assertFalse(resource.exists())

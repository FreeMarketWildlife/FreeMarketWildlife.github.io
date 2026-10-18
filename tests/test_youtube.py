import importlib.util
from datetime import datetime, timedelta, timezone
from pathlib import Path
import unittest
from unittest.mock import patch
import io
import json
from urllib.error import URLError
spec = importlib.util.spec_from_file_location('collector', Path(__file__).resolve().parents[1] / 'scripts/update_youtube.py')
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
NOW = datetime(2026, 10, 17, 16, 23, tzinfo=timezone.utc)

def item(hidden=False):
    return {'id': 'UCtest', 'snippet': {'title': 'Troy Kearns'}, 'statistics':
            {'subscriberCount': '123000', 'viewCount': '987654', 'videoCount': '25', 'hiddenSubscriberCount': hidden}}

class CollectorTests(unittest.TestCase):
    def test_handle_fallback_after_empty_legacy_username(self):
        replies = [io.BytesIO(json.dumps({'items': []}).encode()),
                   io.BytesIO(json.dumps({'items': [item()]}).encode())]
        with patch.object(collector, 'urlopen', side_effect=replies) as network:
            result = collector.fetch_channel('test-key')
        self.assertEqual(result['id'], 'UCtest')
        self.assertIn('forUsername=troykearns', network.call_args_list[0].args[0].full_url)
        self.assertIn('forHandle=troykearns', network.call_args_list[1].args[0].full_url)
        self.assertNotIn('test-key', network.call_args_list[1].args[0].full_url)

    def test_kat_kai_handle_and_channel_identity(self):
        reply = io.BytesIO(json.dumps({'items': [item()]}).encode())
        with patch.object(collector, 'urlopen', return_value=reply) as network:
            collector.fetch_channel('test-key', handle='KatandKaiPeakOfficial')
        self.assertIn('forHandle=KatandKaiPeakOfficial', network.call_args.args[0].full_url)
        result = collector.update({}, '', NOW, channel_url='https://www.youtube.com/@KatandKaiPeakOfficial', channel_title='Kat & Kai')
        self.assertEqual(result['channelTitle'], 'Kat & Kai')
        self.assertEqual(result['channelUrl'], 'https://www.youtube.com/@KatandKaiPeakOfficial')
        self.assertEqual(result['snapshots'], [])

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

class VideoCatalogTests(unittest.TestCase):
    def test_all_pages_batched_and_nonpublic_excluded(self):
        calls = []
        def request(key, endpoint, params):
            calls.append((endpoint, params))
            if endpoint == 'channels':
                return {'items': [{'contentDetails': {'relatedPlaylists': {'uploads': 'uploads'}}}]}
            if endpoint == 'playlistItems':
                indices = range(50) if 'pageToken' not in params else range(49, 52)
                result = {'items': [{'contentDetails': {'videoId': f'v{i}'}} for i in indices]}
                if 'pageToken' not in params: result['nextPageToken'] = 'page2'
                return result
            return {'items': [{'id': id, 'snippet': {'channelId': 'UCtest', 'publishedAt': '2026-10-01T00:00:00Z'},
                               'status': {'privacyStatus': 'private' if id == 'v51' else 'public'}}
                              for id in params['id'].split(',')]}
        result = collector.fetch_catalog('key', 'UCtest', NOW, request)
        self.assertEqual(result['uploadIdsChecked'], 52)
        self.assertEqual(result['publicVideosReturned'], 51)
        batches = [params['id'].split(',') for endpoint, params in calls if endpoint == 'videos']
        self.assertEqual([len(batch) for batch in batches], [50, 2])
        self.assertNotIn('v51', [video['id'] for video in result['videos']])

    def test_repeated_page_token_fails_instead_of_partial_catalog(self):
        def request(key, endpoint, params):
            if endpoint == 'channels': return {'items': [{'contentDetails': {'relatedPlaylists': {'uploads': 'uploads'}}}]}
            return {'items': [], 'nextPageToken': 'repeat'}
        with self.assertRaises(ValueError): collector.fetch_catalog('key', 'UCtest', NOW, request)

    def test_other_channel_rejected(self):
        def request(key, endpoint, params):
            if endpoint == 'channels': return {'items': [{'contentDetails': {'relatedPlaylists': {'uploads': 'uploads'}}}]}
            if endpoint == 'playlistItems': return {'items': [{'contentDetails': {'videoId': 'video'}}]}
            return {'items': [{'id': 'video', 'snippet': {'channelId': 'UCwrong'}, 'status': {'privacyStatus': 'public'}}]}
        with self.assertRaises(ValueError): collector.fetch_catalog('key', 'UCtest', NOW, request)

if __name__ == '__main__': unittest.main()

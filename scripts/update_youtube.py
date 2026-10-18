"""Collect public YouTube channel totals. API key stays in the process environment.
No database dependency; rolling state is held in short-lived CI artifacts, not Git.
"""
import json
import os
from pathlib import Path
import sys
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
MAX_AGE_DAYS = 27  # plus two-day CI artifact retention stays below 30 days
CHANNEL_URL = 'https://www.youtube.com/troykearns'

def timestamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))

def prune(rows, now):
    valid = {}
    for row in rows:
        try:
            observed = timestamp(row['observedAt'])
            if now - timedelta(days=MAX_AGE_DAYS) <= observed <= now:
                valid[observed.date().isoformat()] = row
        except (KeyError, TypeError, ValueError):
            continue
    return [valid[key] for key in sorted(valid, reverse=True)]

def count(stats, key):
    value = stats[key]
    if not str(value).isdigit():
        raise ValueError('Invalid count')
    return int(value)

def snapshot(item, now):
    stats = item['statistics']
    hidden = stats.get('hiddenSubscriberCount', False)
    return {'observedAt': now.isoformat().replace('+00:00', 'Z'),
            'subscribers': None if hidden else count(stats, 'subscriberCount'),
            'views': count(stats, 'viewCount'), 'videos': count(stats, 'videoCount')}

def fetch_channel(key, channel_id=None):
    params = {'part': 'snippet,statistics'}
    # The owner supplied a legacy /troykearns URL; resolve its username once.
    params.update({'id': channel_id} if channel_id else {'forUsername': 'troykearns'})
    req = Request('https://www.googleapis.com/youtube/v3/channels?' + urlencode(params),
                  headers={'X-Goog-Api-Key': key, 'Accept': 'application/json'})
    with urlopen(req, timeout=30) as response:
        payload = json.load(response)
    if len(payload.get('items', [])) != 1:
        raise ValueError('Channel not found')
    item = payload['items'][0]
    if not isinstance(item.get('id'), str) or not item['id'].startswith('UC'):
        raise ValueError('Invalid channel ID')
    return item

def update(previous, key, now, fetch=fetch_channel):
    data = {'schemaVersion': 1, 'status': 'not_configured', 'channelUrl': CHANNEL_URL,
            'channelTitle': 'Troy Kearns', 'channelId': previous.get('channelId'),
            'updatedAt': None, 'snapshots': prune(previous.get('snapshots', []), now)}
    if data['snapshots']:
        data['updatedAt'] = data['snapshots'][0]['observedAt']
    if not data['snapshots']:
        data['channelId'] = None
    if not key:
        return data
    try:
        item = fetch(key, data['channelId'])
        row = snapshot(item, now)
        data['channelId'] = item['id']
        data['channelTitle'] = item['snippet']['title']
        data['snapshots'] = prune([row, *[r for r in data['snapshots']
            if timestamp(r['observedAt']).date() != now.date()]], now)
        data['updatedAt'] = row['observedAt']
        data['status'] = 'ok'
    except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError):
        # Never print API responses, request objects, headers, or credentials.
        data['status'] = 'update_failed'
        print('::warning::YouTube update failed. Check API enablement, key restrictions, quota, and channel username.')
    return data

def main():
    state_path = ROOT / '.youtube-state/youtube.json'
    output_path = ROOT / 'assets/data/youtube.json'
    previous = {}
    if state_path.exists():
        previous = json.loads(state_path.read_text())
    data = update(previous, os.environ.get('YOUTUBE_API_KEY', '').strip(), datetime.now(timezone.utc))
    output_path.write_text(json.dumps(data, indent=2) + '\n')
    print('YouTube collector status: ' + data['status'])
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as stream:
            stream.write(f"YouTube collector: **{data['status']}**. Retained snapshots: {len(data['snapshots'])}.\n")

if __name__ == '__main__':
    main()

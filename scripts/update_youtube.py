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

def fetch_channel(key, channel_id=None, handle=None):
    filters = [{'id': channel_id}] if channel_id else [{'forHandle': handle}] if handle else [
        {'forUsername': 'troykearns'}, {'forHandle': 'troykearns'}]
    payload = {}
    for channel_filter in filters:
        params = {'part': 'snippet,statistics,contentDetails', **channel_filter}
        req = Request('https://www.googleapis.com/youtube/v3/channels?' + urlencode(params),
                      headers={'X-Goog-Api-Key': key, 'Accept': 'application/json'})
        with urlopen(req, timeout=30) as response:
            payload = json.load(response)
        if payload.get('items'):
            break
    if len(payload.get('items', [])) != 1:
        raise ValueError('Channel not found')
    item = payload['items'][0]
    if not isinstance(item.get('id'), str) or not item['id'].startswith('UC'):
        raise ValueError('Invalid channel ID')
    return item

def update(previous, key, now, fetch=fetch_channel, channel_url=CHANNEL_URL, channel_title='Troy Kearns'):
    data = {'schemaVersion': 1, 'status': 'not_configured', 'channelUrl': channel_url,
            'channelTitle': channel_title, 'channelId': previous.get('channelId'),
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
    except HTTPError as error:
        data['status'] = 'update_failed'
        # Only emit the numeric HTTP status, never Google's response or key.
        print(f'::warning::YouTube API returned HTTP {error.code}. Check key activation, API restrictions, and quota.')
    except (URLError, TimeoutError, OSError, ValueError, KeyError, TypeError) as error:
        # Never print API responses, request objects, headers, or credentials.
        data['status'] = 'update_failed'
        reason = 'Channel lookup returned no result.' if isinstance(error, ValueError) and str(error) == 'Channel not found' else 'Network error or invalid response.'
        print('::warning::YouTube update failed. ' + reason)
    return data

def api_get(key, endpoint, params):
    req = Request('https://www.googleapis.com/youtube/v3/' + endpoint + '?' + urlencode(params),
                  headers={'X-Goog-Api-Key': key, 'Accept': 'application/json'})
    with urlopen(req, timeout=30) as response:
        return json.load(response)


def fetch_catalog(key, channel_id, now, request=api_get):
    channels = request(key, 'channels', {'part': 'contentDetails', 'id': channel_id})
    uploads = channels['items'][0]['contentDetails']['relatedPlaylists']['uploads']
    ids, seen_ids, seen_tokens = [], set(), set()
    token = None
    while True:
        params = {'part': 'contentDetails', 'playlistId': uploads, 'maxResults': 50}
        if token:
            params['pageToken'] = token
        page = request(key, 'playlistItems', params)
        for entry in page.get('items', []):
            video_id = entry['contentDetails']['videoId']
            if video_id not in seen_ids:
                ids.append(video_id)
                seen_ids.add(video_id)
        token = page.get('nextPageToken')
        if not token:
            break
        if token in seen_tokens:
            raise ValueError('Repeated pagination token')
        seen_tokens.add(token)
    videos = []
    parts = 'snippet,statistics,contentDetails,status,liveStreamingDetails,recordingDetails,localizations,paidProductPlacementDetails'
    for start in range(0, len(ids), 50):
        page = request(key, 'videos', {'part': parts, 'id': ','.join(ids[start:start + 50])})
        for video in page.get('items', []):
            if video.get('snippet', {}).get('channelId') != channel_id:
                raise ValueError('Unexpected channel')
            if video.get('status', {}).get('privacyStatus') == 'public':
                videos.append(video)
    videos.sort(key=lambda v: (v['snippet'].get('publishedAt', ''), v['id']), reverse=True)
    return {'schemaVersion': 1, 'status': 'ok', 'channelId': channel_id,
            'updatedAt': now.isoformat().replace('+00:00', 'Z'),
            'uploadIdsChecked': len(ids), 'publicVideosReturned': len(videos), 'videos': videos}


def main(prefix='youtube', handle=None, channel_url=CHANNEL_URL, channel_title='Troy Kearns'):
    state_path = ROOT / f'.youtube-state/{prefix}.json'
    output_path = ROOT / f'assets/data/{prefix}.json'
    previous = {}
    if state_path.exists():
        previous = json.loads(state_path.read_text())
    fetch = (lambda key, channel_id: fetch_channel(key, channel_id, handle)) if handle else fetch_channel
    data = update(previous, os.environ.get('YOUTUBE_API_KEY', '').strip(), datetime.now(timezone.utc), fetch, channel_url, channel_title)
    output_path.write_text(json.dumps(data, indent=2) + '\n')
    print('YouTube collector status: ' + data['status'])
    catalog = {'schemaVersion': 1, 'status': 'not_configured', 'updatedAt': None, 'videos': []}
    key = os.environ.get('YOUTUBE_API_KEY', '').strip()
    if key and data['channelId']:
        try:
            catalog = fetch_catalog(key, data['channelId'], datetime.now(timezone.utc))
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, TypeError):
            catalog['status'] = 'update_failed'
            print('::warning::Video catalog update failed; no partial catalog was published.')
    elif key:
        catalog['status'] = 'update_failed'
    (ROOT / f'assets/data/{prefix}-videos.json').write_text(json.dumps(catalog, ensure_ascii=False) + '\n')
    print('YouTube video catalog: ' + catalog['status'] + '; public videos: ' + str(len(catalog['videos'])))
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as stream:
            stream.write(f"YouTube collector: **{data['status']}**. Retained snapshots: {len(data['snapshots'])}.\n")

if __name__ == '__main__':
    main()
    main('kat-kai-youtube', 'KatandKaiPeakOfficial', 'https://www.youtube.com/@KatandKaiPeakOfficial', 'Kat & Kai')

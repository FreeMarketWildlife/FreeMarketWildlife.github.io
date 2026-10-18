"""Platform-independent daily metric snapshots; never invent or interpolate counts."""
from datetime import datetime, timedelta
import math
import re


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', value):
        raise ValueError('Unsafe resource identifier')
    return value


def observations(rows, now, retention_days):
    daily = {}
    for row in rows:
        try:
            at = datetime.fromisoformat(row['observedAt'].replace('Z', '+00:00'))
            metrics = row['metrics']
            if not metrics or any(value is not None and
                (isinstance(value, bool) or not isinstance(value, (int, float)) or
                 not math.isfinite(value) or value < 0) for value in metrics.values()):
                continue
            if now - timedelta(days=retention_days) <= at <= now:
                daily[at.date().isoformat()] = {'observedAt': row['observedAt'], 'metrics': metrics}
        except (KeyError, ValueError, TypeError, AttributeError):
            continue
    return sorted(daily.values(), key=lambda row: row['observedAt'])


def record(previous, identity, resources, observed_at, now, retention_days=27, success=True):
    """A successful complete inventory removes missing resources. Failure retains recent rows.

    resources: {platform_resource_id: {metric_name: nonnegative_count_or_None}}.
    UTC date is the daily key. A retry replaces its day's observation.
    """
    if not 1 <= retention_days <= 27:
        raise ValueError('Retention must be between 1 and 27 days for public tracking')
    old = previous.get('resources', {}) if previous.get('identity') == identity else {}
    output = {}
    for resource_id in (resources if success else old):
        identifier(resource_id)
        rows = list(old.get(resource_id, []))
        if success:
            day = observed_at[:10]
            rows = [row for row in rows if row.get('observedAt', '')[:10] != day]
            rows.append({'observedAt': observed_at, 'metrics': resources[resource_id]})
        rows = observations(rows, now, retention_days)
        if rows:
            output[resource_id] = rows
    return {'schemaVersion': 1, 'identity': identity, 'retentionDays': retention_days,
            'status': 'ok' if success else 'update_failed',
            'lastAttemptAt': now.isoformat().replace('+00:00', 'Z'), 'resources': output}

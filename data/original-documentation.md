# SoberGenZ Speech Database

**120 complete first-person speeches**, divided into 30 themes and four audience categories. Every speech has a greeting, introductory hook, main explanation, illustrative scenario, reflection prompt, actionable advice, and a closing call to action.

These are newly written speech scripts, not audio-derived verbatim records. Check against actual recordings before using them as quotations of delivered speeches.

## Files

| File | Purpose |
| --- | --- |
| `sobergenz_120_speeches.jsonl` | Main data file. **One complete speech per line.** Ideal for ingestion jobs. |
| `sobergenz_120_speeches.json` | The same 120 records as one readable JSON array. |
| `sobergenz_speech_chunks.jsonl` | 600 smaller passages for vector embeddings and retrieval-augmented generation. |
| `sobergenz_120_speeches.sqlite` | Searchable SQLite database with FTS5 full-text search and normalized speech sections. |
| `build_database.py` | Recreates all data files using Python 3 and standard libraries. |
| `example_usage.py` | Filter, inspect, search, and export examples. |
| `statistics.json` | Basic counts and quality checks. |

## Speech record schema

```json
{
  "id": "SGZ-001",
  "organization": "SoberGenZ",
  "speaker_role": "SoberGenZ founder / presenter",
  "title": "The Brain, Reward, and the Choices We Make | Younger secondary students",
  "topic_id": "reward-and-choice",
  "primary_topic": "The Brain, Reward, and the Choices We Make",
  "audience": "Younger secondary students",
  "audience_key": "middle_school",
  "age_range": "12-14",
  "setting": "school assembly / classroom",
  "language": "en",
  "tags": ["neuroscience", "reward", "decision-making"],
  "word_count": 1101,
  "estimated_delivery_minutes": 8,
  "sections": [{"section": "greeting", "text": "Good morning, everyone..."}],
  "transcript": "Good morning, everyone..."
}
```

The schema above is illustrative. The real records contain all 13 complete sections and the full transcript text.

## Quick import in Python

```python
import json

with open("sobergenz_120_speeches.jsonl", encoding="utf-8") as file:
    speeches = [json.loads(line) for line in file]

print(len(speeches))       # 120
print(speeches[0]["id"])
print(speeches[0]["transcript"])

# Filter by theme or audience
matches = [
    speech for speech in speeches
    if "peer-pressure" in speech["tags"]
    and speech["audience_key"] == "high_school"
]
```

## Search in SQLite

```python
import sqlite3

conn = sqlite3.connect("sobergenz_120_speeches.sqlite")
results = conn.execute("""
    SELECT s.id, s.title, s.word_count
    FROM speech_search f
    JOIN speeches s ON s.id = f.id
    WHERE speech_search MATCH ?
    ORDER BY bm25(speech_search)
    LIMIT 10
""", ("peer pressure",)).fetchall()
print(results)
```

SQLite tables:

* `speeches` stores the metadata and complete transcript text.
* `speech_sections` stores ordered, individually retrievable transcript sections.
* `speech_search` is the FTS5 full-text index.

## Using the chunks in an AI knowledge base

Use `sobergenz_speech_chunks.jsonl` for embedding or retrieval. Each record includes `chunk_id`, `speech_id`, `title`, `topic_id`, `audience_key`, `tags`, `section_names`, and `text`.

1. Embed the `text` field.
2. Use `chunk_id` as the vector ID and store the other fields as metadata.
3. Filter by `audience_key` or `topic_id` before retrieving results, if useful.
4. Use `speech_id` to load the original complete record and restore full context.

## Notes

* The speech topics include reward learning, peer pressure, social norms, stress, sleep, mental wellbeing, sports, student leadership, data collection, and preventive health.
* The four audience versions are younger secondary students, older secondary students, university students, and student leaders/educators/ambassadors.
* Speeches share a consistent SoberGenZ voice and educational framework. Some organizational framing language is intentionally repeated across audience versions.
* Medical and safety topics are discussed as general education, not personal medical advice. Adapt to local safeguarding and school policies.
* All institution names and event details are deliberately generic so that no unverified school visit, date, attendance, or personal incident is presented as an observed fact.

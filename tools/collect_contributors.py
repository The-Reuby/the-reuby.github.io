# Collect all content contributors and update the app's contributors data.
#
# Names come from two places, which are merged and de-duplicated:
#   1. Article authors scraped from each issue's metadata
#      (public/data/issues.json -> public/data/<slug>.json -> articles[].author).
#      A single article may credit several people, separated by commas.
#   2. More contributors in tools/more_contributors.json -- people who
#      contributed but are not credited as an article author (e.g. "Sophie Brixton").
#
# The merged list is written into the "contributors" array of
# src/data/contributors.json (the file the Contributors page reads), while the
# hand-curated "editorial", "advisors" and "past" sections are left untouched.
#
# Because the "more" file is a separate input, re-running this script is safe:
# manually added people are preserved instead of disappearing.
#
# Run from the repo root:
#   python tools/collect_contributors.py

import json

ISSUES_PATH = "public/data/issues.json"
MORE_PATH = "tools/more_contributors.json"
APP_DATA_PATH = "src/data/contributors.json"


def scrape_article_authors():
    """Return the set of every author named in any issue's articles."""
    with open(ISSUES_PATH) as f:
        slugs = [issue["slug"] for issue in json.load(f)]

    authors = set()
    for slug in slugs:
        with open(f"public/data/{slug}.json") as f:
            issue_data = json.load(f)
        for article in issue_data["articles"]:
            for author in article["author"].split(","):
                name = author.strip()
                if name:
                    authors.add(name)
    return authors


def load_more():
    """Return manually-added contributors (people who are not article authors)."""
    try:
        with open(MORE_PATH) as f:
            return {name.strip() for name in json.load(f) if name.strip()}
    except FileNotFoundError:
        return set()


def main():
    contributors = scrape_article_authors() | load_more()

    # Update only the "contributors" list; keep the curated sections intact.
    with open(APP_DATA_PATH) as f:
        data = json.load(f)
    data["contributors"] = sorted(contributors, key=str.casefold)
    with open(APP_DATA_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=True)
        f.write("\n")

    print(f"Wrote {len(contributors)} contributors to {APP_DATA_PATH}")


if __name__ == "__main__":
    main()

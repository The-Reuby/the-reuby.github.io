# Collect all the contributors from the issues.json file
# The issue file is in the public/data/issues.json file
# slug is the name of the issue and the meta for each issue will be [slug_name].json in the public/data/ folder

# read the issues.json file
import json
with open('public/data/issues.json', 'r') as file:
    issues = json.load(file)

# collect all issues and their contributors

issues = [issue['slug'] for issue in issues]
contributors = []
# for each issue, read the [slug_name].json file

for issue in issues:
    with open(f'public/data/{issue}.json', 'r') as file:
        issue_data = json.load(file)

    # collect all the contributors, add the contributors to the contributors list and remove duplicates
    # sometimes, there are multiple authors for an article, so we need to split the authors by comma and add each author to the contributors list   
    for article in issue_data['articles']:
        authors = article['author'].split(',')
        for author in authors:
            contributors.append(author.strip())

    # remove duplicates
    contributors = list(set(contributors))

# write the contributors to a json file
with open('tools/content_contributors.json', 'w') as file:
    json.dump(contributors, file)

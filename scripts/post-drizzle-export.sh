#!/usr/bin/env bash

FILE="./setup.sql"

NEW_CONTENT=$(cat <<'EOF'
          setweight(to_tsvector('english', "body"), 'B'));
CREATE INDEX "list_search_index" ON "regreso_list" USING gin (setweight(to_tsvector('english', "name"), 'A') ||
            setweight(to_tsvector('english', "description"), 'B'));
CREATE INDEX "tag_search_index" ON "regreso_tag" USING gin (setweight(to_tsvector('english', "shortcut"), 'A') ||
          setweight(to_tsvector('english', "name"), 'B'));
EOF
)

# Use awk to replace the 6 lines including and after the specified string
awk -v new_content="$NEW_CONTENT" '
BEGIN { found = 0; count = 0 }
{
  if (found && count < 5) {
    count++
    if (count == 5) {
      print new_content
      found = 0
    }
  } else {
    print
  }
  if ($0 ~ /CREATE INDEX "destination_search_index"/) {
    found = 1
    count = 0
  }
}' $FILE > temp && mv temp $FILE
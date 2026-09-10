#!/usr/bin/env bash
#
# End-to-end smoke test: exercises every endpoint the web app calls, as each
# role, against a running API. Verifies status codes and that role restrictions
# actually hold.
#
#   1. npm run dev:api      (in another terminal)
#   2. ./scripts/smoke-test.sh
#
set -uo pipefail

API="${API_URL:-http://localhost:4000}"
PASS=0
FAIL=0

token() {
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"password123\"}" |
    python3 -c "import sys,json;print(json.load(sys.stdin).get('access_token',''))"
}

# check <expected-status> <method> <path> <token> [json-body]
check() {
  local expected="$1" method="$2" path="$3" tok="$4" body="${5:-}"
  local code
  if [ -n "$body" ]; then
    code=$(curl -s -o /tmp/smoke_out -w '%{http_code}' -X "$method" "$API$path" \
      -H "Authorization: Bearer $tok" -H 'Content-Type: application/json' -d "$body")
  else
    code=$(curl -s -o /tmp/smoke_out -w '%{http_code}' -X "$method" "$API$path" \
      -H "Authorization: Bearer $tok")
  fi
  if [ "$code" = "$expected" ]; then
    PASS=$((PASS + 1))
    printf '  \033[32mok\033[0m   %-6s %-46s %s\n' "$method" "$path" "$code"
  else
    FAIL=$((FAIL + 1))
    printf '  \033[31mFAIL\033[0m %-6s %-46s got %s, wanted %s\n' "$method" "$path" "$code" "$expected"
    head -c 200 /tmp/smoke_out; echo
  fi
}

json() { python3 -c "import sys,json;print($1)"; }

echo "Signing in as each role…"
ADMIN=$(token admin@lockedin.test)
HR=$(token hr@lockedin.test)
LEAD=$(token lead@lockedin.test)
EMP=$(token employee@lockedin.test)
for t in "$ADMIN" "$HR" "$LEAD" "$EMP"; do
  [ -z "$t" ] && { echo "Could not sign in — is the API running and seeded?"; exit 1; }
done

TEAM_ID=$(curl -s "$API/teams" -H "Authorization: Bearer $LEAD" | json "json.load(sys.stdin)[0]['id']")
EMP_ID=$(curl -s "$API/auth/me" -H "Authorization: Bearer $EMP" | json "json.load(sys.stdin)['id']")

echo
echo "Shared screens (dashboard, tasks, time, chart, newsletter)"
check 200 GET  /auth/me                                "$EMP"
check 200 GET  /tasks/mine                             "$EMP"
check 200 GET  /time/active                            "$EMP"
check 200 GET  /time/mine                              "$EMP"
check 200 GET  /users                                  "$EMP"
check 200 GET  /teams                                  "$EMP"
check 200 GET  "/teams/$TEAM_ID/members"               "$EMP"
check 200 GET  /departments                            "$EMP"
check 200 GET  /org-chart                              "$EMP"
check 200 GET  /announcements                          "$EMP"
check 200 GET  /chat/channels                          "$EMP"
check 200 GET  /grievances/mine                        "$EMP"
check 200 GET  /hr/leave-types                         "$EMP"
check 200 GET  /hr/leave-balances/mine                 "$EMP"
check 200 GET  /hr/leave-requests/mine                 "$EMP"
check 200 GET  /hr/permission-requests/mine            "$EMP"

echo
echo "Performance screens"
check 200 GET  /gamification/me                        "$EMP"
check 200 GET  /gamification/me/history                "$EMP"
check 200 GET  /gamification/me/skills                 "$EMP"
check 200 GET  /gamification/me/badges                 "$EMP"
check 200 GET  /gamification/skills                    "$EMP"
check 200 GET  /gamification/badges                    "$EMP"
check 200 GET  /gamification/config                    "$EMP"
check 200 GET  /gamification/leaderboard/org           "$EMP"
check 200 GET  "/gamification/leaderboard/team/$TEAM_ID" "$EMP"
check 200 GET  "/remarks/$EMP_ID"                      "$EMP"
check 200 GET  "/gamification/users/$EMP_ID/skills"    "$LEAD"

echo
echo "Team lead screens"
check 200 GET  /tasks/pending-approvals                "$LEAD"
check 200 GET  "/tasks/team/$TEAM_ID"                  "$LEAD"
check 200 GET  "/gamification/team/$TEAM_ID/overview"  "$LEAD"
check 200 GET  /hr/leave-requests/pending              "$LEAD"
check 200 GET  /hr/permission-requests/pending         "$LEAD"

echo
echo "HR and admin screens"
check 200 GET  /grievances                             "$HR"
check 200 GET  /hr/leave-requests/pending              "$HR"
check 200 GET  /gamification/leaderboard/org           "$ADMIN"

echo
echo "Role restrictions hold"
check 403 GET  /grievances                             "$EMP"
check 403 GET  /tasks/pending-approvals                "$EMP"
check 403 GET  "/gamification/team/$TEAM_ID/overview"  "$EMP"
check 403 POST /departments                            "$EMP" '{"name":"Nope"}'
check 403 POST /users                                  "$EMP" '{"email":"x@y.dev","fullName":"X","password":"password123","role":"HR"}'
check 403 POST /announcements                          "$EMP" '{"title":"x","body":"y"}'
check 403 PATCH /gamification/config                   "$LEAD" '{"timeWeight":0.9}'
check 401 GET  /users                                  "invalid-token"

echo
echo "Write paths"
check 201 POST /tasks                                  "$LEAD" "{\"title\":\"Smoke test task\",\"teamId\":\"$TEAM_ID\",\"assigneeId\":\"$EMP_ID\",\"weightage\":3,\"difficulty\":3,\"estimatedMinutes\":60}"
TASK_ID=$(python3 -c "import json;print(json.load(open('/tmp/smoke_out'))['id'])")
check 201 POST "/tasks/$TASK_ID/subtasks"              "$LEAD" '{"title":"Smoke subtask"}'
check 200 PATCH "/tasks/$TASK_ID/status"               "$EMP"  '{"status":"IN_REVIEW"}'
check 200 PATCH "/tasks/$TASK_ID/approve"              "$LEAD" '{"decision":"APPROVED"}'
check 400 PATCH "/tasks/$TASK_ID/status"               "$EMP"  '{"status":"NOT_A_STATUS"}'
check 201 POST /grievances                             "$EMP"  '{"category":"Smoke","description":"Smoke test grievance"}'
check 201 POST /remarks                                "$LEAD" "{\"subjectId\":\"$EMP_ID\",\"content\":\"Smoke test remark\"}"
check 201 POST /gamification/skills                    "$LEAD" '{"name":"SmokeTestSkill"}'

echo
echo "-----------------------------------------"
printf 'passed: %s   failed: %s\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1

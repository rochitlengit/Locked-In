# Demo walkthrough

About 8 minutes, four logins, one story: *work gets assigned, tracked, approved,
and turns into a performance picture the lead and HR can act on.*

Start with `npm run setup` then `npm run dev`, and open http://localhost:3000.
Password for every account is `password123`.

---

## 1. The employee — "what am I working on?" (2 min)

Sign in as **`employee@lockedin.test`** (Dev Patel, senior engineer).

- **Dashboard** — open tasks, how many are past deadline, his current
  performance score and company rank, plus the latest HR announcements.
- **Tasks** — a kanban board of his work. Click any card to expand it: the
  requirements his lead wrote, weight and difficulty, subtask checklist, time
  logged against the estimate, and a **Start timer** button.
- **Time Tracker** — start a timer, watch it run, stop it. The log lands in his
  history and feeds the time-efficiency part of his score.
- **My Performance** — the payoff screen. His overall score broken into the
  three components, a three-month trend line, per-skill scores built from the
  skills tagged on tasks he delivered, badges he has earned, and remarks his
  lead has written about him.
- **Leave & Permissions** — request leave or a couple of permission hours, and
  see the balances he has left.

Worth pointing out: an employee **cannot** mark their own work Done. Moving a
task to Done puts it into review for the lead instead.

---

## 2. The team lead — "how is my team doing?" (3 min)

Sign in as **`lead@lockedin.test`** (Sara Ahmed, Platform Team).

- **Tasks** — now shows the whole team's board. Create a task: set the assignee,
  deadline, weightage and difficulty (1-5 each), an estimate in minutes, and tag
  the skills it exercises. Those four inputs are exactly what the scoring engine
  reads later.
- **Team Performance** — the lead's home base:
  - team average score, headcount, tasks completed, approvals waiting
  - **the approval queue** — approve or send back submitted work inline; approving
    immediately recomputes that person's skills and badges
  - a **scorecard table** for every member: score, each component, completed and
    open tasks, and badges
  - click **Details** on anyone for their skill breakdown and to write a remark
- **Leave & Permissions** — approve or reject the team's pending requests.

Good moment to show cause and effect: approve something from the queue and watch
the member's score and completed count move.

---

## 3. HR — "the people side" (2 min)

Sign in as **`hr@lockedin.test`** (Ravi Menon).

- **Dashboard** — pending leave approvals and open grievances.
- **Grievances** — employees submit confidentially; HR sees everything and moves
  each one Open → In progress → Resolved. Team leads deliberately cannot see this
  list — worth demonstrating by mentioning it.
- **Newsletter** — publish a company-wide update, pin it, and it appears on
  everyone's dashboard.
- **Leave & Permissions** — the full approval queue across the company.
- **Org Chart** — the whole company by reporting line, colour-coded by role.

---

## 4. The admin — "the system behind it" (1 min)

Sign in as **`admin@lockedin.test`** (Aisha Khan).

**Admin Console** has six tabs. The two worth showing:

- **Scoring** — the actual formula, as sliders: how much time efficiency, task
  weight and deadlines each count, plus the bonus per day early and penalty per
  day late. Change a weight, save, and every score in the company recomputes
  against the new policy. This is the "gamification is configurable, not baked
  in" moment.
- **Leaderboard** — the whole company ranked, with each score component visible
  so nobody has to take the number on faith.

The other tabs — People, Teams, Leave types, Skills — are the setup surface for
a new organization.

---

## If you want to show it from zero

Sign out and use **"New organization? Create a workspace"** on the login page.
The first person to register becomes the Super Admin of a brand-new, empty
organization: add departments, teams, people and skills from the Admin Console
and the whole thing builds up from nothing. `npm run db:seed` puts the demo
company back.

---

## Questions people usually ask

**"Can employees game the score?"** Only approved work counts, and the lead sets
weight, difficulty and the estimate — the two biggest inputs are not in the
employee's hands.

**"What if a task has no deadline or no estimate?"** Those components score
neutral (70) rather than zero, so people are not punished for missing metadata
their lead did not provide.

**"Where does the skill data come from?"** Skills are tagged on tasks. When work
is approved, that task's score is folded into the assignee's score for each
tagged skill — so skill ratings are earned from delivery, not self-assessed.

**"Is it tied to SQLite?"** No. It ships on SQLite so the demo needs no setup;
`npm run db:postgres` switches the same schema to PostgreSQL.

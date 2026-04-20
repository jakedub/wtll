## Database Stuff
jake
C@rlsberg9075
superuser

## Super User Stuff
jake.w.moore@proton.me
admin
C@rlsberg9075

## Run Both End from WTLL
chmod +x scripts/dev.sh
---

### Verify PostgreSQL Database

1. Connect to PostgreSQL using your new role:
   ```bash
   psql -U jake -d wtll_dev
   ```

2. Once inside `psql`, you can verify:
   - List databases:
     ```sql
     \l
     ```
   - List roles:
     ```sql
     \du
     ```

3. Exit psql:
   ```sql
   \q
   ```

If you can connect successfully and see the `wtll_dev` database owned by `jake`, your database is ready to use in Django.

### Django Routes

- Admin Panel: http://localhost:8000/admin/
- API Docs (if using DRF with drf-yasg or similar): http://localhost:8000/docs/

### Create a Django Superuser

1. Activate your virtual environment:
   ```bash
   source backend/venv/bin/activate
   ```
2. Run the createsuperuser command:
   ```bash
   python backend/manage.py createsuperuser
   ```
3. Enter a username, email, and password when prompted.
4. Log into the admin panel at [http://localhost:8000/admin/](http://localhost:8000/admin/) with these credentials.

### Aliases
dj='python manage.py'
djactivate='source ~/Documents/wtll/backend/venv/bin/activate'
djm='python manage.py migrate'
djmm='python manage.py makemigrations'
djr='python manage.py runserver'
python=python3
run-help=man
which-command=whence






⸻

🧱 1. Data Model Changes (Do This First)

Add these models—don’t try to reuse draft/eval tables.

✅ Create Team

* Name
* Type (Rec, Showcase)
* Division (Majors, AAA, 11U, 9U)

⸻

✅ Create PlayerTeam

(Many-to-many bridge)

* Player (FK)
* Team (FK)

👉 This is what solves your “AAA kid playing 11U” problem.

⸻

✅ Create PitchLog

* Player (FK)
* Team (FK)
* GameDate (date)
* PitchCount (int)
* CreatedBy (coach/user)

⸻

⚠️ Check Existing Player Model

Make sure you have:

* Birthdate (needed for rules)

If not → add it now. Don’t hack around this later.

⸻

⚙️ 2. Backend Logic (Core Feature)

Create a service layer—not just views.

✅ Build: calculate_pitch_availability(player_id, date)

This should:

1. Pull last 5 days of PitchLog
2. Find most recent outing
3. Determine:
    * Pitch count
    * Required rest days
    * Next eligible date

Use rules aligned with Little League Baseball.

⸻

✅ Create API Endpoints

POST /pitch-log

* Save new pitch entry

GET /player/{id}/availability

Returns:

* Last pitched date
* Last pitch count
* Required rest
* Eligible date
* Eligible (true/false)

⸻

✅ Add Validation (Important)

On POST /pitch-log:

* Warn if player is not eligible
* Don’t block submission (coaches will override in real life)

⸻

🖥️ 3. React Frontend (Keep It Simple)

Do NOT overbuild this UI.

✅ Page: “Pitch Tracker”

Components:

* Team selector
* Player dropdown (filtered by team)
* Date picker
* Pitch count input

⸻

✅ On Player Select

Call:
/player/{id}/availability

Display:

* Last outing
* Rest required
* ✅ Eligible / ❌ Not eligible
* Next available date

⸻

✅ Submit Flow

* Submit pitch log
* Show updated status immediately

⸻

🔐 4. Permissions (Don’t Skip This)

You already have users—use that.

✅ Restrict by Team

* Coach only sees players on their teams
* Use your existing auth structure

⸻

✅ Track Ownership

* Save CreatedBy on pitch logs

⸻

📊 5. Admin / Reporting (Lightweight)

Don’t go crazy here yet.

✅ Add Django Admin Views

* Filter by player
* Filter by date range

⸻

✅ Optional (Nice-to-have)

* “Last 7 days pitches” per player
* Basic export (CSV)

⸻

🧪 6. Testing (Minimum Viable)

Test these cases:

* Player pitches in rec + showcase back-to-back
* Player hits exact threshold (e.g., 35 pitches)
* Player logs multiple outings in short window
* Different age brackets

If this logic is wrong, the whole app loses trust.

⸻

🚀 7. Deployment

Since this is already live:

✅ Backend

* Add migrations
* Deploy to your existing host

✅ Frontend

* Add route/page
* Deploy normally

No new infrastructure needed.

⸻

⚠️ Where This Can Go Sideways

Be aware of these traps:

* ❌ Treating teams separately (breaks rest rules)
* ❌ Letting coaches input without seeing eligibility first
* ❌ Not filtering players by team (UI becomes unusable fast)
* ❌ Overbuilding dashboards nobody will use

⸻

💡 Smart Add (High Value, Low Effort)

Add a simple status indicator:

* 🟢 Available
* 🟡 Close to limit
* 🔴 Not eligible

That alone makes this actually usable during games.

⸻

🧭 Reality Check

You can build this into your WTLL app—but it will take:

* A few solid evenings to do right
* Testing time
* Coach onboarding

That’s why your instinct to pivot to AppSheet is smart for immediate use.

⸻
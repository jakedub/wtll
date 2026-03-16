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
# 🗄️ Complete Database Setup Guide for Sahibak App

## 📋 Overview

This guide provides complete SQL scripts to set up the Sahibak application database from scratch, including schema, seed data, roles, functions, and RLS policies.

---

## 📁 SQL Scripts Available

### 1. **complete_database_setup.sql** ⭐ MAIN SCRIPT
- **Purpose**: Complete database setup including schema, functions, triggers, and RLS policies
- **When to use**: When setting up a new database or after major schema changes
- **Contents**: 
  - Database schema (all tables, indexes, constraints)
  - Database functions and triggers
  - Basic seed data (categories, app config)
  - Complete RLS policies
  - Verification queries

### 2. **seed_test_data.sql** 
- **Purpose**: Adds test data for development/testing
- **When to use**: After running the main setup script
- **Contents**:
  - Test users (regular, provider, admin, banned)
  - Test places (approved, pending)
  - Test offers (approved, pending)
  - Test news
  - Test favorites
  - Test reports
  - Test edit requests

### 3. **complete_rls_setup.sql** (also available)
- **Purpose**: RLS policies only (if you already have schema)
- **When to use**: If you need to reset/update RLS policies only

---

## 🚀 Setup Instructions

### Step 1: Run Main Database Setup

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `complete_database_setup.sql`
5. Paste it into the editor
6. Click **Run** button
7. Wait for completion (should show "✅ Database Setup Complete!")

### Step 2: Create Test Users (Important!)

The seed data script uses placeholder UUIDs. You need real user IDs from Supabase Auth:

#### Option A: Use App Sign Up Flow
1. Run your app
2. Sign up users through the app
3. Note down their UUIDs from the profiles table
4. Replace placeholders in seed_test_data.sql

#### Option B: Create Users Manually in Supabase
1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add user** to create test users
3. Copy the UUIDs from the user list
4. Replace placeholders in seed_test_data.sql

**Test users to create:**
- Regular user (محمد أحمد)
- Provider 1 (علي حسن)
- Provider 2 (فاطمة محمود)  
- Provider 3 (أحمد خالد)
- Banned provider (مستخدم محظور)
- Admin user (create manually and set role to 'admin')

### Step 3: Run Seed Data Script

1. Replace placeholder UUIDs in `seed_test_data.sql` with real user IDs
2. In Supabase SQL Editor, create a new query
3. Copy and paste the updated seed_test_data.sql
4. Click **Run**
5. Verify test data is created

---

## 📊 Database Schema Overview

### Tables Created (11 tables)

1. **profiles** - User profiles and roles
2. **categories** - Category hierarchy (parent/child)
3. **places** - Business places and service providers
4. **place_categories** - Junction table for place-category relationships
5. **place_services** - Services offered by places
6. **offers** - Special offers and promotions
7. **news** - News and announcements
8. **favorites** - User favorites
9. **reports** - User reports of places
10. **place_edit_requests** - Edit requests for approval workflow
11. **audit_log** - Admin action logging
12. **app_config** - Application configuration

### Key Features

- **UUID primary keys** for security
- **Foreign key constraints** for data integrity
- **Indexes** for performance optimization
- **Check constraints** for data validation
- **Auto-updating timestamps** via triggers
- **Soft deletes** with deleted_at timestamps

---

## 🔐 RLS Security Policies

### Public Read Access (Anonymous & Authenticated)
- ✅ Categories (active only)
- ✅ News
- ✅ Approved places (not deleted)
- ✅ Place categories (junction table)
- ✅ Place services
- ✅ Approved offers (active, not expired)

### User-Specific Access
- ✅ **Profiles**: Users can read all (for lookups), update own
- ✅ **Favorites**: Users can only access their own
- ✅ **Reports**: Users can read/write own, admins can access all
- ✅ **Edit Requests**: Providers can access own, admins can access all
- ✅ **Audit Log**: Admins only

---

## 🧪 Test Data Overview

### Test Users Created (5 users)
- **Regular User**: محمد أحمد (ID: 00000000-0000-0000-0000-000000000001)
- **Provider 1**: علي حسن (2 places)
- **Provider 2**: فاطمة محمود (1 place)
- **Provider 3**: أحمد خالد (2 places)
- **Banned Provider**: For testing ban functionality

### Test Places Created (6 places)
- **4 Approved places**: Ready for testing
- **1 Pending place**: For testing approval workflow
- **1 Per provider**: Following business rules (3 shops, 5 persons limit)

### Test Categories (8 parent + 14 child)
- Restaurants, Cafes, Health, Education, Services, Shopping, Construction, Transportation
- Multiple child categories per parent

### Test Data for Each Feature
- ✅ **Favorites**: 2 test favorites
- ✅ **Offers**: 3 offers (2 approved, 1 pending)
- ✅ **News**: 3 news items (1 pinned)
- ✅ **Reports**: 2 test reports
- ✅ **Edit Requests**: 2 test edit requests

---

## 🛠️ Database Functions & Triggers

### Functions
- **update_updated_at_column()**: Automatically updates updated_at timestamp

### Triggers (9 tables)
- Automatic timestamp updates on all tables with updated_at field
- Ensures data consistency

---

## ✅ Verification

Each script includes verification queries that show:
- Number of tables created
- Number of policies created
- Sample data counts
- Completion status

---

## 📝 Important Notes

### Before Running Scripts
1. **Backup existing data** if you have any
2. **Test in development environment** first
3. **Review the scripts** to understand what they do

### After Running Scripts
1. **Verify the schema** matches your expectations
2. **Check RLS policies** are working correctly
3. **Test with the app** to ensure data loads correctly
4. **Create real admin user** in Supabase Auth

### UUID Replacements
The seed data script uses placeholder UUIDs (00000000-0000-0000-0000-000000000001). You MUST replace these with actual user UUIDs from your Supabase Auth system:

```sql
-- Replace this with real UUIDs
INSERT INTO profiles (id, full_name, phone, role, is_banned) VALUES
('YOUR_REAL_UUID_HERE', 'User Name', '07700000000', 'user', FALSE);
```

---

## 🎯 Expected Results After Setup

### Schema Setup
- ✅ 11 tables created with proper constraints
- ✅ 20+ indexes for performance
- ✅ 9 triggers for auto-updates
- ✅ 16 RLS policies for security

### Seed Data (after UUID replacement)
- ✅ 5 test users (with different roles)
- ✅ 6 test places (mix of approved/pending)
- ✅ 22 test categories (8 parent + 14 child)
- ✅ 3 test offers
- ✅ 3 test news items
- ✅ Test favorites, reports, edit requests

### App Functionality
- ✅ Home screen loads all data
- ✅ Users can browse categories and places
- ✅ Providers can add places (subject to limits)
- ✅ Admin can approve/reject places
- ✅ Favorites work correctly
- ✅ Reports can be submitted
- ✅ Edit requests flow works

---

## 🔄 Resetting Database

If you need to start fresh:

```sql
-- Drop all tables (CASCADE will drop dependent data)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS place_edit_requests CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP TABLE IF EXISTS place_services CASCADE;
DROP TABLE IF EXISTS place_categories CASCADE;
DROP TABLE IF EXISTS places CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;

-- Then re-run complete_database_setup.sql
```

---

## 🆘 Troubleshooting

### Issue: RLS policies not working
**Solution**: Ensure scripts ran successfully and check policy creation in verification output

### Issue: Test data not loading
**Solution**: Replace placeholder UUIDs with real user IDs from Supabase Auth

### Issue: App shows no data
**Solution**: 
1. Verify RLS policies are created
2. Check places have status = 'approved'
3. Ensure categories are active (is_active = true)

### Issue: Foreign key errors
**Solution**: Ensure parent data exists before creating child records

---

## 📚 Additional Resources

- **Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
- **RLS Documentation**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Functions**: https://www.postgresql.org/docs/current/sql-createfunction.html

---

## ✨ Summary

The database setup is now complete with:
- ✅ Full schema with all tables and relationships
- ✅ Security through RLS policies
- ✅ Performance through indexes
- ✅ Data integrity through constraints
- ✅ Automation through triggers
- ✅ Test data for development
- ✅ Complete documentation

Run the scripts in order and your Sahibak app database will be ready for production use!

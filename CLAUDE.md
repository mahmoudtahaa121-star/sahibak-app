# صاحبك (Sahibak) - Project Summary

## App Information

**App Name**: صاحبك (Sahibak) - Arabic for "Your Friend"  
**Purpose**: Local business directory for finding services, shops, and individuals in Al-Mansouriyah  
**Target Area**: Al-Mansouriyah (المنصورية), Iraq  
**Version**: 1.0.0  
**Package**: com.sahibak.app  

## Tech Stack

### Core
- **Expo SDK**: 55.0.24
- **React Native**: 0.83.6
- **React**: 19.2.0
- **TypeScript**: 5.9.2
- **Expo Router**: 55.0.14 (file-based routing)

### Backend & Data
- **Supabase**: 2.105.4 (auth, database, storage)
- **TanStack React Query**: 5.100.10 (data fetching & caching)
- **React Native MMKV**: 3.3.3 (local storage)

### UI & UX
- **React Native Reanimated**: 4.2.1 (animations)
- **React Native Maps**: 1.27.2 (maps integration)
- **Expo Vector Icons**: 15.0.2
- **Cairo Font**: Arabic font family (Regular, SemiBold, Bold)

### Other
- **Expo Secure Store**: 55.0.14 (secure storage)
- **Expo Web Browser**: 55.0.16 (OAuth)
- **Expo Auth Session**: 55.0.16 (OAuth)
- **Expo Sharing**: 55.0.19 (share functionality)
- **React Native NetInfo**: 11.5.2 (offline detection)

## Screens & Status

### Main Navigation (Tabs)
- **Home** (`(tabs)/index.tsx`) - ✅ COMPLETE
  - Search functionality
  - Area selector (multi-area support)
  - Categories grid with parent/child hierarchy
  - Places list with filters
  - News carousel
  - Offers banner
  - Offline support with cached data

- **Offers** (`(tabs)/offers.tsx`) - ✅ COMPLETE
  - List of active offers
  - Filtered by selected area
  - Pull-to-refresh

- **Favorites** (`(tabs)/favorites.tsx`) - ✅ COMPLETE
  - User's saved places
  - Requires authentication
  - Remove from favorites

- **More** (`(tabs)/more.tsx`) - ✅ COMPLETE
  - User profile display
  - Role-based navigation (admin/provider dashboards)
  - About app modal
  - Contact support
  - Sign out functionality

### Authentication
- **Login** (`auth/login.tsx`) - ✅ COMPLETE
  - Email/password authentication
  - Google OAuth integration
  - Profile auto-creation on first login

- **Register** (`auth/register.tsx`) - ✅ COMPLETE
  - Role selection (user/provider)
  - Full name, phone, email, password
  - Profile creation
  - Email confirmation support

### Places & Categories
- **Place Details** (`place/[id].tsx`) - ✅ COMPLETE
  - Full place information
  - Services list
  - Offers display
  - WhatsApp integration
  - Phone call integration
  - Google Maps integration
  - Share functionality
  - Favorite toggle
  - Report functionality

- **Category View** (`category/[id].tsx`) - ✅ COMPLETE
  - Filter by place type (all/shop/person)
  - Places count display
  - Pull-to-refresh

- **All Categories** (`category/all.tsx`) - ✅ COMPLETE
  - Grid view of all parent categories
  - Color-coded icons

- **All Places** (`places/all.tsx`) - ✅ EXISTS (needs verification)

### Provider Portal
- **Provider Dashboard** (`provider/dashboard.tsx`) - ✅ COMPLETE
  - Place statistics (total/approved/pending)
  - List of provider's places
  - Status badges
  - Admin rejection notes display
  - Edit place navigation

- **Add Place** (`provider/add-place.tsx`) - ✅ COMPLETE
  - Multi-step form (4 steps)
  - Place type selection (shop/person)
  - Category selection (parent/child hierarchy)
  - Basic information (name, phone, whatsapp, description, address)
  - Services management (add/remove)
  - Place limits enforcement
  - Area selection

- **Edit Place** (`provider/edit-place/[id].tsx`) - ✅ COMPLETE
  - Edit existing place information
  - Submit edit requests for admin approval
  - Field-by-field edit submission

### Admin Portal
- **Admin Dashboard** (`admin/dashboard.tsx`) - ✅ COMPLETE
  - Statistics (approved places, pending places, total users, providers, active offers)
  - Pending places approval/rejection
  - Pending offers approval/rejection
  - Edit requests approval/rejection
  - Reports management
  - Provider management (ban/unban)
  - Audit logging for all actions

## Database Schema Summary

### Core Tables

**profiles**
- id (UUID, primary key)
- full_name (text)
- phone (text)
- role (enum: user, provider, admin)
- is_banned (boolean)

**categories**
- id (integer, primary key)
- parent_id (integer, nullable, self-reference)
- name_ar (text)
- name_en (text, nullable)
- icon (text, nullable)
- color (text, nullable)
- sort_order (integer)
- is_active (boolean)
- show_on_home (boolean)
- place_type_hint (enum: shop, person, both)

**places**
- id (UUID, primary key)
- provider_id (UUID, foreign key to profiles)
- area (text)
- place_type (enum: shop, person)
- name_ar (text)
- name_en (text, nullable)
- description_ar (text, nullable)
- phone (text)
- whatsapp (text, nullable)
- address_text (text, nullable)
- latitude (numeric, nullable)
- longitude (numeric, nullable)
- image_url (text, nullable)
- status (enum: pending, approved, rejected)
- admin_note (text, nullable)
- deleted_at (timestamp, nullable)
- created_at (timestamp)

**place_services**
- id (UUID, primary key)
- place_id (UUID, foreign key to places)
- name_ar (text)
- description_ar (text, nullable)
- sort_order (integer)

**place_categories** (junction table)
- place_id (UUID, foreign key to places)
- category_id (integer, foreign key to categories)

**offers**
- id (UUID, primary key)
- place_id (UUID, foreign key to places)
- place_service_id (UUID, nullable, foreign key to place_services)
- title_ar (text)
- description_ar (text, nullable)
- expires_at (timestamp, nullable)
- status (enum: pending, approved, rejected)
- deleted_at (timestamp, nullable)

**news**
- id (UUID, primary key)
- title_ar (text)
- body_ar (text, nullable)
- image_url (text, nullable)
- is_pinned (boolean)
- created_at (timestamp)

**favorites**
- user_id (UUID, foreign key to profiles)
- place_id (UUID, foreign key to places)
- created_at (timestamp)

**reports**
- id (UUID, primary key)
- place_id (UUID, foreign key to places)
- user_id (UUID, foreign key to profiles)
- reason (text)
- status (enum: pending, reviewed)
- created_at (timestamp)

**place_edit_requests**
- id (UUID, primary key)
- place_id (UUID, foreign key to places)
- provider_id (UUID, foreign key to profiles)
- field_name (text)
- old_value (text)
- new_value (text)
- status (enum: pending, approved, rejected)
- created_at (timestamp)

**audit_log**
- id (UUID, primary key)
- admin_id (UUID, foreign key to profiles)
- action (text)
- target_type (text)
- target_id (text)
- created_at (timestamp)

**app_config**
- key (text, primary key)
- value (text)

## User Roles & Permissions

### User (مقيم / زائر)
- Browse places and categories
- Search places
- View place details
- Add places to favorites
- Report places
- View offers
- View news

### Provider (صاحب خدمة)
- All user permissions
- Add new places (subject to limits)
- Edit own places (via edit requests)
- View place status (pending/approved/rejected)
- View admin rejection notes
- Add offers (via edit requests or direct)

### Admin (مدير)
- All provider permissions
- Approve/reject places
- Approve/reject offers
- Approve/reject edit requests
- Ban/unban providers
- Review reports
- View audit logs
- Full access to all data

## Business Rules

### Place Limits
- **Shops**: Maximum 3 places per provider
- **Persons**: Maximum 5 places per provider
- Limits are enforced in the add place form
- Deleted places do not count toward limits

### Approval Flow
- **Places**: All new places start as `pending` status
  - Admin must approve before visible to users
  - Rejected places show admin note to provider
  - Providers can edit and resubmit rejected places

- **Offers**: All new offers start as `pending` status
  - Admin must approve before visible to users
  - Can be linked to specific places or services

- **Edit Requests**: All field edits go through approval
  - Providers submit edit requests
  - Admin reviews and approves/rejects each field change
  - Approved changes are applied to the place

### Category Structure
- Hierarchical categories (parent → child)
- Parent categories shown on home screen
- Child categories shown in bottom sheet when parent selected
- Categories can be filtered by place type hint (shop/person/both)
- Categories can be marked as active/inactive
- Categories can be pinned to home screen

### Area System
- Multi-area support (e.g., different neighborhoods in Al-Mansouriyah)
- Users can switch between areas
- All data (places, offers) filtered by selected area
- Area selection persisted in local storage

### Reporting System
- Users can report places with a reason
- Reports go to admin dashboard
- Admin can mark reports as reviewed
- No automatic actions taken on reports

### Banning System
- Admin can ban providers
- Banned providers cannot add/edit places
- Banned status is checked on auth
- Existing places from banned providers remain visible

## Current Sprint Status

**Status**: Core features complete, production-ready

**Completed Features**:
- ✅ User authentication (email/password + Google OAuth)
- ✅ User registration with role selection
- ✅ Home screen with search, categories, places, news, offers
- ✅ Place details with full information
- ✅ Favorites management
- ✅ Category browsing with filters
- ✅ Provider dashboard
- ✅ Add place multi-step form
- ✅ Edit place functionality
- ✅ Admin dashboard with full approval workflow
- ✅ Offer management
- ✅ Report system
- ✅ Audit logging
- ✅ Offline support with cached data
- ✅ Multi-area support
- ✅ WhatsApp and phone integration
- ✅ Google Maps integration
- ✅ Share functionality

**Known Issues**: None critical

**Recent Fixes**:
- N/A (no recent issues reported)

## Development Notes

### Environment Variables Required
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Key Hooks
- `useAuth` - Authentication state management
- `useArea` - Area selection and persistence
- `usePlaces` - Fetch places by area
- `useCategoryPlaces` - Fetch places by category
- `useFavorites` - Favorite places management
- `useAddPlace` - Place creation mutation
- `useOffers` - Offers by area
- `useNews` - News feed
- `useCategories` - Category hierarchy

### Key Components
- `PlaceCard` - Place list item
- `OfferCard` - Offer list item
- `NewsCard` - News list item
- `Skeleton` - Loading skeleton
- `Badge` - Status badges

### Styling
- Primary color: `#1B4332` (dark green)
- Secondary color: `#D4A843` (gold)
- Background: `#F8F9FA` (light gray)
- Font: Cairo (Arabic)
- RTL (right-to-left) layout throughout

### File Structure
```
app/
├── (tabs)/          # Main tab navigation
├── admin/           # Admin dashboard
├── auth/            # Authentication screens
├── category/        # Category browsing
├── place/           # Place details
├── places/          # All places listing
└── provider/        # Provider portal
```

## Deployment

**Build Configuration**:
- Android: compileSdkVersion 36, targetSdkVersion 36
- iOS: Supports iPad
- EAS Project ID: 2964679a-d9a0-43bf-91eb-926384252f6c

**Available Scripts**:
- `npm start` - Start development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

# Auth0 Roles Setup Guide

## Required Roles for Dashboard Access

### 1. Super Admin
- Role ID: `super_admin` or `admin`
- Access: Full system access
- Dashboard: Super Admin Dashboard (current one)

### 2. IT Admin 
- Role ID: `it_admin` or `system_admin`
- Access: Same as Super Admin
- Dashboard: Super Admin Dashboard

### 3. Department/MAC Admin
- Role ID: `department_admin` or `mac_admin`
- Access: Department-scoped only
- Dashboard: Department Dashboard

## Auth0 Setup Instructions

### Step 1: Create Roles in Auth0
1. Go to Auth0 Dashboard → User Management → Roles
2. Create these roles:
   - `super_admin` - Full system access
   - `it_admin` - IT administrator access  
   - `department_admin` - Department administrator access

### Step 2: Create Permissions (Optional)
1. User Management → Permissions
2. Create permissions like:
   - `read:all_assets`
   - `write:all_assets`
   - `read:department_assets`
   - `write:department_assets`

### Step 3: Assign Roles to Users (Two Methods)

**Method A - Using Auth0 Roles (Standard):**
1. User Management → Users → [Select User]
2. Roles tab → Assign Roles
3. Select appropriate role

**Method B - Using App Metadata (Recommended for Organizations):**
1. User Management → Users → [Select User]
2. Details tab → Scroll to "app_metadata" section
3. Add JSON like:
```json
{
  "roles": ["super_admin"]
}
```
4. Save

**Use Method B if you're using Auth0 Organizations**

### Step 4: Configure Custom Claims
1. Auth0 Dashboard → Actions → Flows → Login
2. Add custom action to include roles in token:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://gov-tracker.com/';
  
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}roles`, event.authorization.roles);
    
    // Add user metadata
    if (event.user.user_metadata) {
      api.idToken.setCustomClaim(`${namespace}department`, event.user.user_metadata.department);
      api.idToken.setCustomClaim(`${namespace}clearance_level`, event.user.user_metadata.clearance_level);
    }
  }
};
```

## Testing Different Dashboards

### Test as Super Admin:
1. Assign `super_admin` role to your user
2. Login → Should see full dashboard

### Test as IT Admin:
1. Assign `it_admin` role to your user  
2. Login → Should see same full dashboard as super admin

### Test as Department Admin:
1. Assign `department_admin` role to your user
2. Set user metadata: `department: "Ministry of Health"`
3. Login → Should see department-scoped dashboard

## Current Role Detection Logic

The app checks roles in this order:
1. `super_admin` or `admin` → Super Admin Dashboard
2. `it_admin` or `system_admin` → Super Admin Dashboard  
3. `department_admin` or `mac_admin` → Department Dashboard
4. No roles → Access denied message

## Next Steps

After setting up roles, the app will automatically:
- Route users to appropriate dashboards
- Filter map data by department (for dept admins)
- Show/hide navigation items based on permissions
- Scope all data queries to user's department

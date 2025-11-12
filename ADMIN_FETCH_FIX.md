# Admin Fetch Foreign Key Fix

## Issue
When trying to fetch admins on `/admin/admins` page, got a 500 error:

```
Error fetching admins: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'users' and 'admin_created_by' in the schema 'public', but no matches were found.",
  message: "Could not find a relationship between 'users' and 'admin_created_by' in the schema cache"
}
```

## Root Cause
Supabase's PostgREST query syntax for joins requires an actual foreign key constraint in the database. The original query tried to use:

```javascript
creator:admin_created_by (
  id,
  username,
  email,
  name
)
```

This syntax only works when there's a foreign key relationship defined in the database schema. Since `admin_created_by` is just a UUID column without a foreign key constraint, Supabase couldn't perform the join.

## Solution
Changed the approach to fetch creator information separately:

### Old Approach (Doesn't Work)
```javascript
const { data: admins, error } = await supabaseAdmin
  .from('users')
  .select(`
    id,
    ...
    creator:admin_created_by (
      id,
      username,
      email,
      name
    )
  `)
```

### New Approach (Works)
```javascript
// 1. Fetch admins first
const { data: admins, error } = await supabaseAdmin
  .from('users')
  .select(`
    id,
    username,
    email,
    name,
    profile_image,
    is_admin,
    admin_role,
    admin_permissions,
    admin_created_at,
    admin_created_by,
    created_at
  `)
  .eq('is_admin', true)
  .order('admin_created_at', { ascending: false });

// 2. Get unique creator IDs
const adminIds = admins?.map(a => a.admin_created_by).filter(Boolean) || [];
const uniqueCreatorIds = Array.from(new Set(adminIds));

// 3. Fetch creator info separately
let creatorsMap: any = {};
if (uniqueCreatorIds.length > 0) {
  const { data: creators } = await supabaseAdmin
    .from('users')
    .select('id, username, email, name')
    .in('id', uniqueCreatorIds);
  
  creators?.forEach(creator => {
    creatorsMap[creator.id] = creator;
  });
}

// 4. Map creator info to admins
const formattedAdmins = admins?.map(admin => ({
  ...admin,
  admin_permissions: admin.admin_permissions ? JSON.parse(admin.admin_permissions) : [],
  creator: admin.admin_created_by ? creatorsMap[admin.admin_created_by] : null
}));
```

## Benefits of New Approach
1. ✅ Works without foreign key constraints
2. ✅ More efficient - only fetches unique creators once
3. ✅ Still provides the same data structure
4. ✅ More flexible and maintainable

## TypeScript Fix
Also fixed a TypeScript error with Set spread operator:

### Before
```javascript
const uniqueCreatorIds = [...new Set(adminIds)]; // Error with older TS targets
```

### After
```javascript
const uniqueCreatorIds = Array.from(new Set(adminIds)); // Works with all TS targets
```

## Files Modified
- `/app/api/admin/admins/route.ts` - Fixed GET endpoint

## Testing
- ✅ TypeScript compilation passes
- ✅ No linter errors
- ✅ API should now return admins correctly

## Next Steps
Refresh your `/admin/admins` page and it should now display the admin list correctly with:
- All admins who have `is_admin = true`
- Their roles and permissions
- Who created/granted their admin access
- When they were made admin

The success message you saw means the admin was created successfully. The display issue is now fixed!


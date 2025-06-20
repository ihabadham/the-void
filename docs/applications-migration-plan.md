# 📋 **APPLICATIONS MIGRATION PLAN**

## 🎯 **Migration Strategy Overview**

This plan outlines the migration of applications from localStorage to our Drizzle + Supabase database setup. The strategy focuses on creating robust API routes with full validation while maintaining our existing client component architecture.

### **Current State Analysis:**
- **3 localStorage keys** heavily used: `void-applications`, `void-documents`, `void-settings`
- **8 major pages** using applications localStorage
- **Complex relationships** between applications and documents
- **File uploads** currently using `URL.createObjectURL()` (temporary URLs)
- **Validation system** fully implemented with Zod schemas
- **Database schemas** ready and aligned with validation

---

## 🏗️ **Phase 1: API Infrastructure**

### **1.1 Applications API Routes**
Create RESTful API endpoints with full validation:

```
app/api/applications/
├── route.ts (GET, POST)
├── [id]/
│   ├── route.ts (GET, PUT, DELETE)
│   └── documents/
│       └── route.ts (GET application's documents)
└── export/
    └── route.ts (Export functionality)
```

**Implementation Details:**
- Use `withValidation` wrapper from our API utils
- Implement proper error handling with `createErrorResponse`
- Add pagination support for GET requests
- Include user authentication checks
- Support filtering and search parameters

### **1.2 Documents API Routes**
```
app/api/documents/
├── route.ts (GET, POST with file upload)
├── [id]/
│   ├── route.ts (GET, PUT, DELETE)
│   └── download/
│       └── route.ts (Secure file download)
└── upload/
    └── route.ts (Direct file upload endpoint)
```

### **1.3 Enhanced Data Access Layer**
Extend existing data access functions with:
- **Pagination support** for large datasets
- **Advanced filtering** (status, date ranges, search)
- **Bulk operations** for efficient data handling
- **Transaction support** for coupled app+document operations

---

## 📁 **Phase 2: File Storage Integration**

### **2.1 Supabase Storage Setup**
Create file storage utilities:

```typescript
// lib/storage/
├── documents.ts (Upload, download, delete files)
├── types.ts (Storage types and interfaces)
└── utils.ts (File validation, processing)
```

### **2.2 File Upload Flow**
1. **Client uploads** file to API endpoint
2. **API validates** file (size, type, security checks)
3. **Store in Supabase** storage with organized structure:
   ```
   documents/
   └── {userId}/
       └── {applicationId}/
           └── {documentId}-{filename}
   ```
4. **Save metadata** to database with storage URL

### **2.3 File Security**
- **File type validation** (whitelist approach)
- **File size limits** (enforced in validation)
- **Signed URLs** for secure file access
- **User isolation** (all files scoped to user)

---

## 🔄 **Phase 3: Client Component Migration**

### **3.1 Applications Pages**
Update existing client components to use API routes:

- `app/applications/page.tsx` - Replace localStorage with API calls
- `app/applications/[id]/page.tsx` - Update detail view
- `app/applications/new/page.tsx` - Update creation flow
- `app/page.tsx` (dashboard) - Update dashboard data

### **3.2 API Integration Pattern**
Implement consistent pattern across all components:

```typescript
// Example pattern for API calls
const [applications, setApplications] = useState<Application[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchApplications() {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      setApplications(data.data);
    } catch (error) {
      // Handle errors
    } finally {
      setLoading(false);
    }
  }
  
  fetchApplications();
}, []);
```

### **3.3 State Management**
- **Local state** for component-specific data
- **Optimistic updates** for better UX
- **Error handling** with toast notifications
- **Loading states** for async operations

---

## 🎨 **Phase 4: User Experience**

### **4.1 Basic Loading States**
- **Loading indicators** for API calls
- **Skeleton loaders** for data fetching
- **Error states** with retry options

### **4.2 Enhanced Features**
With database backend, implement:
- **Search functionality** across applications
- **Status filtering** and sorting options
- **Data export** functionality
- **File download** with secure URLs

---

## 📊 **Implementation Sequence**

### **Phase 1: API Infrastructure**
1. Create applications API routes with full validation
2. Create documents API routes with file upload
3. Enhance data access layer with advanced features
4. Setup Supabase storage utilities

### **Phase 2: File Storage Integration**
1. Implement file upload system
2. Setup secure file storage in Supabase
3. Create file download and management APIs
4. Add file validation and security

### **Phase 3: Client Component Migration**
1. Update applications listing page
2. Update application detail and edit pages
3. Migrate new application creation
4. Update dashboard integration

### **Phase 4: User Experience**
1. Add loading states and error handling
2. Implement enhanced search and filtering
3. Add data export functionality
4. Polish file upload/download experience

---

## 🔐 **Security Implementation**

### **API Security**
- **Authentication checks** on all endpoints
- **Input validation** using Zod schemas
- **Rate limiting** on file uploads
- **CORS configuration** for secure access

### **Data Security**
- **Row Level Security** (RLS) in Supabase
- **User isolation** (all queries filtered by userId)
- **Secure file access** with signed URLs
- **Data validation** at API and database level

---

## 📋 **Key Migration Points**

### **localStorage Keys to Remove:**
- `void-applications` → Database applications table
- `void-documents` → Database documents table + Supabase storage
- Related cleanup in settings export/import

### **Files Requiring Updates:**
- `/app/page.tsx` - Dashboard applications
- `/app/applications/page.tsx` - Applications listing
- `/app/applications/[id]/page.tsx` - Application details
- `/app/applications/new/page.tsx` - New application creation
- `/app/documents/page.tsx` - Documents management
- `/app/calendar/page.tsx` - Calendar view
- `/app/settings/page.tsx` - Export/import functionality

### **New Files to Create:**
- API routes for applications and documents
- File storage utilities
- Enhanced data access functions
- Type definitions for API responses

---

This migration plan provides a structured approach to moving from localStorage to a robust database-backed system while maintaining the existing client component architecture and improving the overall user experience. 
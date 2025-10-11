## **3. Priority Feature 3: Member Data Storage & Database**

### **3.1 Database Schema Design**

#### **3.1.1 Core Tables Structure**

**Users Table**:
```sql
- id (UUID, Primary Key)
- email (VARCHAR, UNIQUE, NOT NULL)
- phone_number (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- first_name (VARCHAR(50), NOT NULL)
- last_name (VARCHAR(50), NOT NULL)
- profile_picture_url (VARCHAR)
- bio (TEXT, max 500 chars)
- location (VARCHAR(100))
- date_of_birth (DATE)
- gender (ENUM: male/female/other/prefer_not_to_say)
- role (ENUM: admin/moderator/member)
- status (ENUM: pending/active/suspended/deleted)
- email_verified (BOOLEAN, DEFAULT FALSE)
- phone_verified (BOOLEAN, DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

**User_Preferences Table**:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to Users)
- email_notifications (BOOLEAN, DEFAULT TRUE)
- whatsapp_notifications (BOOLEAN, DEFAULT TRUE)
- push_notifications (BOOLEAN, DEFAULT TRUE)
- profile_visibility (ENUM: public/private/admin_only)
- show_contact_info (BOOLEAN, DEFAULT FALSE)
- show_activity_status (BOOLEAN, DEFAULT TRUE)
- show_statistics (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**User_Sessions Table**:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to Users)
- access_token_hash (VARCHAR)
- refresh_token_hash (VARCHAR)
- device_info (JSON)
- ip_address (INET)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- last_used (TIMESTAMP)
```

#### **3.1.2 Supporting Tables**

**Categories Table**:
```sql
- id (UUID, Primary Key)
- name (VARCHAR(100), UNIQUE, NOT NULL)
- description (TEXT)
- icon_url (VARCHAR)
- color_code (VARCHAR(7))
- parent_id (UUID, Foreign Key to Categories)
- sort_order (INTEGER)
- is_active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
```

**User_Interests Table** (Many-to-Many relationship):
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to Users)
- category_id (UUID, Foreign Key to Categories)
- created_at (TIMESTAMP)
```

**Audit_Logs Table**:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to Users)
- action (VARCHAR(50))
- table_name (VARCHAR(50))
- record_id (UUID)
- old_values (JSON)
- new_values (JSON)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

### **3.2 Data Management Requirements**

#### **3.2.1 Data Validation**
**User Story**: As a system administrator, I want all user data to be validated and consistent so that the database maintains integrity.

**Validation Rules**:
- Email addresses must be unique and follow RFC 5322 standard
- Phone numbers must include country code and be validated
- Passwords must meet security requirements (8+ chars, mixed case, numbers, symbols)
- Profile pictures must be under 5MB and approved formats
- Bio text must be under 500 characters
- Names must contain only letters, spaces, and common punctuation

#### **3.2.2 Data Security**
**Security Requirements**:
- All passwords stored as bcrypt hashes (cost factor 12)
- Sensitive data encrypted at rest
- PII (Personally Identifiable Information) clearly marked and protected
- All database connections use SSL/TLS
- Regular automated backups with encryption
- Access logs for all data modifications

#### **3.2.3 Data Retention & Deletion**
**Data Lifecycle Management**:
- Inactive accounts (no login for 2+ years) flagged for review
- Deleted accounts maintain minimal record for 30 days (legal/dispute resolution)
- User can request complete data export (GDPR compliance)
- User can request account deletion with data purge
- Audit logs retained for 7 years
- Session tokens automatically purged after expiration

### **3.3 Data Access Patterns**

#### **3.3.1 Common Queries**
**Frequently Used Data Operations**:
- User authentication lookup (by email/phone + password)
- Profile information retrieval (by user ID)
- Member directory listing (with pagination and filtering)
- User preferences loading (by user ID)
- Interest-based member matching
- Activity logging and audit trail queries

#### **3.3.2 Performance Requirements**
**Database Performance Standards**:
- User login queries must complete within 200ms
- Profile loading must complete within 300ms
- Member search results within 500ms
- Database connections pooled (max 100 concurrent)
- Read replicas for reporting queries
- Indexes on frequently queried columns (email, phone, status, created_at)

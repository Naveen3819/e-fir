-- ===================================================
-- E-FIR MANAGEMENT SYSTEM - DATABASE SCHEMA
-- PostgreSQL Relational Database Schema
-- ===================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'police', 'admin')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. POLICE STATIONS TABLE
CREATE TABLE IF NOT EXISTS police_stations (
    id SERIAL PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL,
    station_code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    jurisdiction_pincodes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_police_stations_code ON police_stations(station_code);
CREATE INDEX IF NOT EXISTS idx_police_stations_district ON police_stations(district);

-- 3. OFFICERS TABLE
CREATE TABLE IF NOT EXISTS officers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    rank VARCHAR(50) NOT NULL CHECK (rank IN ('Constable', 'Head Constable', 'ASI', 'SI', 'Inspector', 'Admin')),
    police_station_id INT REFERENCES police_stations(id) ON DELETE SET NULL,
    department VARCHAR(100) DEFAULT 'General Crime',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_officers_station ON officers(police_station_id);
CREATE INDEX IF NOT EXISTS idx_officers_emp_id ON officers(employee_id);

-- 4. COMPLAINT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS complaint_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    citizen_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES complaint_categories(id),
    police_station_id INT NOT NULL REFERENCES police_stations(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    incident_date DATE NOT NULL,
    incident_time TIME,
    incident_location TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN (
        'Submitted',
        'Under Verification',
        'Information Required',
        'Accepted',
        'FIR Registered',
        'Assigned',
        'Under Investigation',
        'Resolved',
        'Closed',
        'Rejected'
    )),
    assigned_officer_id INT REFERENCES officers(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    info_request_message TEXT,
    info_response_message TEXT,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_station ON complaints(police_station_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_number ON complaints(complaint_number);

-- 6. EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    uploaded_by INT NOT NULL REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    file_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_complaint ON evidence(complaint_id);

-- 7. FIRS TABLE
CREATE TABLE IF NOT EXISTS firs (
    id SERIAL PRIMARY KEY,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    complaint_id INT UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    police_station_id INT NOT NULL REFERENCES police_stations(id),
    registered_by INT NOT NULL REFERENCES officers(id),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sections TEXT NOT NULL,
    description TEXT NOT NULL,
    investigation_officer_id INT REFERENCES officers(id) ON DELETE SET NULL,
    accused_details TEXT,
    status VARCHAR(50) DEFAULT 'Registered' CHECK (status IN (
        'Registered',
        'Assigned',
        'Investigation Started',
        'Evidence Collection',
        'Verification',
        'Further Action',
        'Completed',
        'Chargesheet Filed',
        'Closed'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_firs_number ON firs(fir_number);
CREATE INDEX IF NOT EXISTS idx_firs_complaint ON firs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_firs_station ON firs(police_station_id);
CREATE INDEX IF NOT EXISTS idx_firs_io ON firs(investigation_officer_id);

-- 8. INVESTIGATION UPDATES TABLE
CREATE TABLE IF NOT EXISTS investigation_updates (
    id SERIAL PRIMARY KEY,
    fir_id INT NOT NULL REFERENCES firs(id) ON DELETE CASCADE,
    officer_id INT NOT NULL REFERENCES officers(id),
    update_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    document_filename VARCHAR(255),
    document_stored_filename VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_updates_fir ON investigation_updates(fir_id);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 11. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    complaint_id INT UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    citizen_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_complaint ON feedback(complaint_id);

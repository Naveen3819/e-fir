-- ===================================================
-- E-FIR MANAGEMENT SYSTEM - SEED DATA
-- Default Demo Accounts (Password: Password@123)
-- ===================================================

-- 1. COMPLAINT CATEGORIES
INSERT INTO complaint_categories (id, name, description, status) VALUES
(1, 'Theft', 'Theft of movable property, vehicles, electronics, or personal belongings', 'active'),
(2, 'Cyber Crime', 'Hacking, unauthorized access, identity theft, malware, and digital threats', 'active'),
(3, 'Financial Fraud', 'Online banking scams, UPI fraud, credit card fraud, investment Ponzi schemes', 'active'),
(4, 'Missing Person', 'Reports of missing children, adults, or elderly individuals', 'active'),
(5, 'Lost Documents', 'Loss of Passport, Driving License, Aadhaar, PAN card, or Certificates', 'active'),
(6, 'Property Related', 'Trespassing, illegal property encroachment, vandalism, or property dispute', 'active'),
(7, 'Harassment', 'Stalking, physical or digital harassment, workplace harassment, intimidation', 'active'),
(8, 'Accident', 'Road traffic accidents, hit-and-run incidents, reckless driving', 'active'),
(9, 'Domestic Complaint', 'Domestic disputes, marital conflicts, family grievances', 'active'),
(10, 'Online Fraud', 'E-commerce delivery frauds, fake job scams, lottery/lottery prize frauds', 'active'),
(11, 'Other', 'Other non-cognizable and civil grievances requiring police assistance', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. POLICE STATIONS
INSERT INTO police_stations (id, station_name, station_code, address, district, state, contact_number, email, jurisdiction_pincodes, status) VALUES
(1, 'Central Police Station', 'STN-DL-001', 'Parliament Street, Connaught Place', 'New Delhi', 'Delhi', '+91-11-23340000', 'centralps.delhi@police.gov.in', '110001, 110002, 110003', 'active'),
(2, 'Cyber Crime Police Station', 'STN-UP-002', 'Sector 62, Electronic City', 'Gautam Buddha Nagar', 'Uttar Pradesh', '+91-120-2440001', 'cyberps.noida@police.gov.in', '201301, 201307, 201309', 'active'),
(3, 'Metro South Police Station', 'STN-KA-003', '100ft Road, Indiranagar', 'Bengaluru Urban', 'Karnataka', '+91-80-25250002', 'metrosouth.bengaluru@police.gov.in', '560038, 560008, 560075', 'active'),
(4, 'West Coastal Police Station', 'STN-MH-004', 'Hill Road, Bandra West', 'Mumbai Suburban', 'Maharashtra', '+91-22-26400003', 'westcoastal.mumbai@police.gov.in', '400050, 400051, 400052', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. USERS (Bcrypt hash corresponds to 'Password@123')
INSERT INTO users (id, name, email, mobile, password_hash, role, address, city, state, pincode, status) VALUES
(1, 'Rajesh Sharma (Admin)', 'admin@example.com', '+91-9876543210', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'admin', 'Police HQ, Jai Singh Road', 'New Delhi', 'Delhi', '110001', 'active'),
(2, 'Inspector Vikram Rathore', 'police@example.com', '+91-9811002233', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'police', 'Officer Enclave, Chanakyapuri', 'New Delhi', 'Delhi', '110021', 'active'),
(3, 'SI Meena Kumari', 'subinspector.meena@example.com', '+91-9811004455', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'police', 'Civil Lines', 'New Delhi', 'Delhi', '110054', 'active'),
(4, 'Inspector Amit Verma', 'cyber.verma@example.com', '+91-9811006677', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'police', 'Sector 50', 'Noida', 'Uttar Pradesh', '201301', 'active'),
(5, 'Rahul Deshmukh', 'citizen@example.com', '+91-9700011223', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'citizen', 'Flat 402, Royal Palms, Barakhamba Road', 'New Delhi', 'Delhi', '110001', 'active'),
(6, 'Priya Patel', 'priya.patel@example.com', '+91-9700033445', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'citizen', 'Villa 12, Green Glen Layout, Bellandur', 'Bengaluru', 'Karnataka', '560103', 'active'),
(7, 'Anita Singh', 'anita.singh@example.com', '+91-9700055667', '$2b$10$vBCMjTnMAv6wHEIHPP/IUOHsOJBRYrEftQRYKPisPFQdXV5KAhBr6', 'citizen', 'Sector 62, B-Block', 'Noida', 'Uttar Pradesh', '201309', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. OFFICERS
INSERT INTO officers (id, user_id, employee_id, rank, police_station_id, department, status) VALUES
(1, 2, 'POL-DL-4401', 'Inspector', 1, 'Crime Investigation', 'active'),
(2, 3, 'POL-DL-5120', 'SI', 1, 'General Crime Unit', 'active'),
(3, 4, 'POL-UP-3392', 'Inspector', 2, 'Cyber Forensics & Fraud', 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. COMPLAINTS
INSERT INTO complaints (id, complaint_number, citizen_id, category_id, police_station_id, title, description, incident_date, incident_time, incident_location, district, state, pincode, status, assigned_officer_id, remarks) VALUES
(1, 'E-FIR-2026-000101', 5, 1, 1, 'Theft of Dell XPS Laptop & Bag from Car', 'Complainant parked car outside Metro Station Gate 2. Upon return, the rear quarter glass was broken and a black Samsonite bag containing Dell XPS 15 laptop (Serial #DXP99420) and passport was stolen.', '2026-09-20', '18:45:00', 'Metro Station Gate 2 Parking, Connaught Place', 'New Delhi', 'Delhi', '110001', 'FIR Registered', 1, 'Prima facie cognizable offence of theft under section 379 IPC.'),
(2, 'E-FIR-2026-000102', 7, 3, 2, 'UPI Phishing Scam Rs. 85,000 via Fake Electricity Bill Link', 'Received an SMS claiming electricity power would be disconnected tonight. Clicked link and was prompted to pay Rs. 10 updating charge. Subsequently Rs. 85,000 was debited in three transactions to unfamiliar VPA.', '2026-09-22', '14:15:00', 'Online / Resident at Sector 62', 'Gautam Buddha Nagar', 'Uttar Pradesh', '201309', 'Under Investigation', 3, 'Transaction reference bank notices dispatched. Beneficiary account frozen.'),
(3, 'E-FIR-2026-000103', 5, 5, 1, 'Lost Passport and Degree Certificates in Transit', 'While traveling by auto-rickshaw from Rajiv Chowk to Mandi House, left behind an envelope containing original Indian Passport (Z1234567) and Master Degree Certificate.', '2026-09-24', '11:30:00', 'En route Rajiv Chowk to Mandi House', 'New Delhi', 'Delhi', '110001', 'Under Verification', 2, 'Verification in progress with auto union and traffic surveillance.'),
(4, 'E-FIR-2026-000104', 6, 2, 3, 'Instagram Impersonation and Harassment', 'An unauthorized account with my photographs and name is sending defamatory messages to colleagues and family asking for money.', '2026-09-23', '20:00:00', 'Social Media / Online', 'Bengaluru Urban', 'Karnataka', '560038', 'Information Required', NULL, 'Awaiting URL and screenshot evidence from complainant.'),
(5, 'E-FIR-2026-000105', 5, 1, 1, 'Stolen OnePlus 12 Mobile at Coffee Shop', 'Left phone on the table while picking up coffee order. Device was turned off within 5 minutes. IMEI 1: 864590051122334.', '2026-09-25', '16:00:00', 'Outer Circle, Connaught Place', 'New Delhi', 'Delhi', '110001', 'Submitted', NULL, NULL),
(6, 'E-FIR-2026-000106', 7, 1, 2, 'Bicycle Theft from Apartment Compound', 'Decathlon Rockrider bicycle stolen from cycle stand despite cable lock.', '2026-09-10', '22:00:00', 'Apartment Basement, Sector 62', 'Gautam Buddha Nagar', 'Uttar Pradesh', '201309', 'Resolved', 3, 'Bicycle recovered from scrap dealer near bypass. Handed over to owner.')
ON CONFLICT (id) DO NOTHING;

-- UPDATE info request message for Complaint 4
UPDATE complaints SET info_request_message = 'Please provide the exact Instagram profile URL and screenshots showing the fraudulent requests.' WHERE id = 4;

-- 6. FIRS
INSERT INTO firs (id, fir_number, complaint_id, police_station_id, registered_by, registration_date, sections, description, investigation_officer_id, accused_details, status) VALUES
(1, 'FIR/DL/2026/000101', 1, 1, 1, '2026-09-21 10:30:00', 'Section 379, 427 Indian Penal Code / BNS Section 303', 'FIR registered regarding breaking of car quarter glass and theft of high-value laptop and documents outside metro station.', 1, 'Unknown persons, surveillance footage being analyzed.', 'Assigned'),
(2, 'FIR/UP/2026/000102', 2, 2, 3, '2026-09-23 09:00:00', 'Section 420 IPC, Section 66C, 66D Information Technology Act 2000', 'FIR registered for cyber fraud using forged electricity disconnection notices and unauthorized fund transfers.', 3, 'Account holder associated with UPI ID fastpay912@yesbank.', 'Evidence Collection')
ON CONFLICT (id) DO NOTHING;

-- 7. INVESTIGATION UPDATES
INSERT INTO investigation_updates (id, fir_id, officer_id, update_type, description, created_at) VALUES
(1, 1, 1, 'Status Change', 'Case assigned to Inspector Vikram Rathore. IO visited the crime scene at Gate 2 Metro parking.', '2026-09-21 11:00:00'),
(2, 1, 1, 'Evidence Collected', 'CCTV footage obtained from DMRC camera #14 covering parking area. Identified two suspects on a black motorcycle.', '2026-09-21 16:30:00'),
(3, 2, 3, 'Status Change', 'Investigation initiated by Cyber Crime cell. Notice under Section 91 CrPC issued to payment gateway.', '2026-09-23 10:30:00'),
(4, 2, 3, 'Evidence Collection', 'Bank nodal officer confirmed freezing of Rs. 42,000 remaining in beneficiary account.', '2026-09-24 15:00:00')
ON CONFLICT (id) DO NOTHING;

-- 8. NOTIFICATIONS
INSERT INTO notifications (id, user_id, message, type, link, is_read, created_at) VALUES
(1, 5, 'Your complaint E-FIR-2026-000101 has been verified and registered as FIR/DL/2026/000101.', 'success', '/complaints/1', false, '2026-09-21 10:35:00'),
(2, 5, 'Investigation officer Inspector Vikram Rathore has been assigned to FIR/DL/2026/000101.', 'info', '/complaints/1', true, '2026-09-21 11:05:00'),
(3, 6, 'Police officer has requested additional information regarding complaint E-FIR-2026-000104.', 'warning', '/complaints/4', false, '2026-09-24 09:30:00'),
(4, 7, 'Your complaint E-FIR-2026-000106 has been resolved. You can now download the closure report and provide feedback.', 'success', '/complaints/6', false, '2026-09-25 14:00:00'),
(5, 2, 'New complaint E-FIR-2026-000105 received at Central Police Station.', 'info', '/police/complaints', false, '2026-09-25 16:05:00')
ON CONFLICT (id) DO NOTHING;

-- 9. AUDIT LOGS
INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at) VALUES
(1, 1, 'USER_LOGIN', 'users', '1', NULL, 'Successful login', '127.0.0.1', '2026-09-25 09:00:00'),
(2, 2, 'VERIFY_COMPLAINT', 'complaints', '1', 'Submitted', 'Accepted', '127.0.0.1', '2026-09-21 10:15:00'),
(3, 2, 'REGISTER_FIR', 'firs', '1', NULL, 'FIR/DL/2026/000101 created', '127.0.0.1', '2026-09-21 10:30:00'),
(4, 3, 'REQUEST_INFO', 'complaints', '4', 'Under Verification', 'Information Required', '127.0.0.1', '2026-09-24 09:30:00')
ON CONFLICT (id) DO NOTHING;

-- 10. FEEDBACK
INSERT INTO feedback (id, complaint_id, citizen_id, rating, comments, created_at) VALUES
(1, 6, 7, 5, 'Quick response by Sector 62 police station. The bicycle was recovered within 10 days. Very professional conduct!', '2026-09-25 15:30:00')
ON CONFLICT (id) DO NOTHING;

-- 11. SYNCHRONIZE SERIAL SEQUENCES
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('police_stations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM police_stations));
SELECT setval('officers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM officers));
SELECT setval('complaint_categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM complaint_categories));
SELECT setval('complaints_id_seq', (SELECT COALESCE(MAX(id), 1) FROM complaints));
SELECT setval('firs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM firs));
SELECT setval('investigation_updates_id_seq', (SELECT COALESCE(MAX(id), 1) FROM investigation_updates));
SELECT setval('notifications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM notifications));
SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit_logs));
SELECT setval('feedback_id_seq', (SELECT COALESCE(MAX(id), 1) FROM feedback));


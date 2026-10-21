const express = require('express');
const { authenticate, authorize, attachStudent } = require('../middleware/auth');

const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const students = require('../controllers/studentController');
const hostels = require('../controllers/hostelController');
const rooms = require('../controllers/roomController');
const requests = require('../controllers/requestController');
const allocations = require('../controllers/allocationController');
const fees = require('../controllers/feeController');
const payments = require('../controllers/paymentController');
const maintenance = require('../controllers/maintenanceController');
const dashboard = require('../controllers/dashboardController');
const reports = require('../controllers/reportController');
const system = require('../controllers/systemController');
const publicInfo = require('../controllers/publicController');

const router = express.Router();

// Public (landing page)
router.get('/public/overview', publicInfo.overview);

// Auth
router.post('/auth/login', auth.login);
router.post('/auth/forgot-password', auth.requestPasswordReset);
router.post('/auth/reset-password', auth.resetPassword);
router.get('/auth/me', authenticate, auth.me);
router.post('/auth/logout', authenticate, auth.logout);
router.post('/auth/change-password', authenticate, auth.changePassword);

// Users (System Admin)
router.get('/users', authenticate, authorize('SYSTEM_ADMIN'), users.listUsers);
router.post('/users', authenticate, authorize('SYSTEM_ADMIN'), users.createUser);
router.put('/users/:id', authenticate, authorize('SYSTEM_ADMIN'), users.updateUser);

// Students
router.get('/students/me', authenticate, authorize('STUDENT'), attachStudent, students.myProfile);
router.get('/students', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), students.listStudents);
router.get('/students/:id', authenticate, attachStudent, students.getStudent);
router.post('/students', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), students.createStudent);
router.put('/students/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), students.updateStudent);
router.post('/students/:id/deactivate', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), students.deactivateStudent);
router.post('/students/:id/activate', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), students.activateStudent);

// Hostels
router.get('/hostels', authenticate, hostels.listHostels);
router.get('/hostels/:id', authenticate, hostels.getHostel);
router.post('/hostels', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), hostels.createHostel);
router.put('/hostels/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), hostels.updateHostel);
router.delete('/hostels/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), hostels.deleteHostel);

// Rooms
router.get('/rooms', authenticate, rooms.listRooms);
router.get('/rooms/:id', authenticate, rooms.getRoom);
router.post('/rooms', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), rooms.createRoom);
router.put('/rooms/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), rooms.updateRoom);
router.delete('/rooms/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), rooms.deleteRoom);

// Hostel requests
router.get('/requests', authenticate, attachStudent, requests.listRequests);
router.post('/requests', authenticate, attachStudent, authorize('STUDENT', 'HOSTEL_ADMIN', 'SYSTEM_ADMIN'), requests.createRequest);
router.post('/requests/:id/review', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), requests.reviewRequest);
router.post('/requests/:id/cancel', authenticate, attachStudent, requests.cancelRequest);
router.post('/requests/:id/cancel-admin', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), requests.cancelRequestByAdmin);

// Allocations / check-in / check-out
router.get('/allocations', authenticate, attachStudent, allocations.listAllocations);
router.post('/allocations', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), allocations.createAllocation);
router.post('/allocations/:id/cancel', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), allocations.cancelAllocation);
router.post('/allocations/:id/transfer', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), allocations.transferAllocation);
router.post('/check-in', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), allocations.checkIn);
router.post('/check-out', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), allocations.checkOut);

// Fees
router.get('/fees', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), fees.listFees);
router.post('/fees', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), fees.createFee);
router.put('/fees/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), fees.updateFee);
router.post('/fees/assign', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), fees.assignFee);
router.get('/fees/account/me', authenticate, authorize('STUDENT'), attachStudent, fees.studentAccount);
router.get('/fees/account/:studentId', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), fees.studentAccount);

// Payments (manual verification recording only)
router.get('/payments', authenticate, attachStudent, payments.listPayments);
router.post('/payments', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), payments.recordPayment);

// Maintenance
router.get('/maintenance', authenticate, attachStudent, maintenance.listMaintenance);
router.post('/maintenance', authenticate, attachStudent, authorize('STUDENT', 'HOSTEL_ADMIN', 'SYSTEM_ADMIN'), maintenance.createMaintenance);
router.put('/maintenance/:id', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), maintenance.updateMaintenance);

// Dashboards
router.get('/dashboard/admin', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), dashboard.adminDashboard);
router.get('/dashboard/student', authenticate, authorize('STUDENT'), attachStudent, dashboard.studentDashboard);

// Reports
router.get('/reports/:type', authenticate, authorize('SYSTEM_ADMIN', 'HOSTEL_ADMIN'), reports.generateReport);

// System admin
router.get('/system/audit-logs', authenticate, authorize('SYSTEM_ADMIN'), system.listAuditLogs);
router.get('/system/settings', authenticate, authorize('SYSTEM_ADMIN'), system.listSettings);
router.post('/system/settings', authenticate, authorize('SYSTEM_ADMIN'), system.upsertSetting);
router.post('/system/backup', authenticate, authorize('SYSTEM_ADMIN'), system.backupDatabase);
router.get('/system/backups', authenticate, authorize('SYSTEM_ADMIN'), system.listBackups);
router.post('/system/restore', authenticate, authorize('SYSTEM_ADMIN'), system.restoreBackup);

module.exports = router;

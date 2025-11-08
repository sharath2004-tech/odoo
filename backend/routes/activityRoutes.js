import express from 'express';
import { pool } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all activity logs (Admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId, userRole, module, action, startDate, endDate, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        id,
        user_id as userId,
        user_name as userName,
        user_role as userRole,
        action,
        module,
        details,
        created_at as timestamp
      FROM activity_logs
      WHERE 1=1
    `;
    
    const params = [];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (userRole) {
      query += ' AND user_role = ?';
      params.push(userRole);
    }
    
    if (module) {
      query += ' AND module = ?';
      params.push(module);
    }
    
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [logs] = await pool.query(query, params);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
});

// Get activity statistics (Admin only)
router.get('/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as totalActivities,
        COUNT(DISTINCT user_id) as activeUsers,
        SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) as creates,
        SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as updates,
        SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as deletes,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as todayActivities
      FROM activity_logs
    `);

    const [moduleStats] = await pool.query(`
      SELECT 
        module,
        COUNT(*) as count
      FROM activity_logs
      GROUP BY module
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        overview: stats[0],
        byModule: moduleStats
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity statistics' });
  }
});

// Get user activity history (Admin only)
router.get('/user/:userId', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const [logs] = await pool.query(
      `SELECT 
        id,
        user_name as userName,
        user_role as userRole,
        action,
        module,
        details,
        created_at as timestamp
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?`,
      [userId, parseInt(limit)]
    );
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user activity' });
  }
});

// Delete old logs (Admin only - for maintenance)
router.delete('/cleanup', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { daysOld = 90 } = req.query;
    
    const [result] = await pool.query(
      'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [parseInt(daysOld)]
    );
    
    // Log this cleanup activity
    await pool.query(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, module, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, req.user.fullName, req.user.role, 'DELETE', 'System', 
       `Cleaned up ${result.affectedRows} activity logs older than ${daysOld} days`]
    );
    
    res.json({
      success: true,
      message: `Deleted ${result.affectedRows} old activity logs`,
      data: { deletedCount: result.affectedRows }
    });
  } catch (error) {
    console.error('Cleanup logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to cleanup activity logs' });
  }
});

export default router;

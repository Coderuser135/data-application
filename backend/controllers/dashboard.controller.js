import * as dashboardService from '../services/dashboard.service.js';

export async function getAdminStats(req, res, next) {
  try {
    const stats = await dashboardService.getAdminStats();
    res.json(stats);
  } catch (err) { next(err); }
}

export async function getRevenueAnalytics(req, res, next) {
  try {
    const { period } = req.query;
    const data = await dashboardService.getRevenueAnalytics(period);
    res.json(data);
  } catch (err) { next(err); }
}

export async function getUserDashboard(req, res, next) {
  try {
    const data = await dashboardService.getUserDashboard(req.user._id);
    res.json(data);
  } catch (err) { next(err); }
}

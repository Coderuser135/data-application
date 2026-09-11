import * as membershipPlanService from '../services/membershipPlan.service.js';

export async function getAllPlans(req, res, next) {
  try {
    const plans = await membershipPlanService.getAllPlans();
    res.json(plans);
  } catch (err) { next(err); }
}

export async function createPlan(req, res, next) {
  try {
    const plan = await membershipPlanService.createPlan(req.body);
    res.status(201).json(plan);
  } catch (err) { next(err); }
}

export async function updatePlan(req, res, next) {
  try {
    const plan = await membershipPlanService.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (err) { next(err); }
}

export async function deletePlan(req, res, next) {
  try {
    await membershipPlanService.deletePlan(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (err) { next(err); }
}

import * as membershipService from '../services/membership.service.js';

export const getMyMemberships = async (req, res, next) => {
  try { res.json(await membershipService.getMembershipsByUserId(req.user._id)); } catch (err) { next(err); }
};
export const getAllMemberships = async (req, res, next) => {
  try { res.json(await membershipService.getAllMemberships()); } catch (err) { next(err); }
};
export const getActivePlans = async (req, res, next) => {
  try { res.json(await membershipService.getActivePlans()); } catch (err) { next(err); }
};
export const getAdvancePaid = async (req, res, next) => {
  try {
    if (!req.query.membershipId) return res.json({ advancePaid: 0 });
    res.json({ advancePaid: await membershipService.getAdvancePaid(req.user._id, req.query.membershipId) });
  } catch (err) { next(err); }
};
export const purchaseMembership = async (req, res, next) => {
  try { res.status(201).json(await membershipService.purchaseMembership(req.user._id, req.body.planId)); } catch (err) { next(err); }
};
export const payAdvance = async (req, res, next) => {
  try { res.status(201).json(await membershipService.payAdvance(req.user._id, req.body.membershipId)); } catch (err) { next(err); }
};
export const renewMembership = async (req, res, next) => {
  try { res.status(201).json(await membershipService.renewMembership(req.user._id, req.params.id)); } catch (err) { next(err); }
};
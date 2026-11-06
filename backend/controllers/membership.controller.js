import * as membershipService from '../services/membership.service.js';

export const getMyMemberships = async (req, res, next) => {
  try { res.json(await membershipService.getMembershipsByUserId(req.user._id)); } catch (err) { next(err); }
};
export const getAllMemberships = async (req, res, next) => {
  try { res.json(await membershipService.getAllMemberships(req.query)); } catch (err) { next(err); }
};
export const getActivePlans = async (req, res, next) => {
  try { res.json(await membershipService.getActivePlans(req.user._id)); } catch (err) { next(err); }
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
export const getMembershipDetails = async (req, res, next) => {
  try { res.json(await membershipService.getMembershipDetails(req.params.id)); } catch (err) { next(err); }
};


export const adminRenewMembership = async (req, res, next) => {
  try { res.status(201).json(await membershipService.adminRenewMembership(req.params.id)); } catch (err) { next(err); }
};
export const extendMembership = async (req, res, next) => {
  try { res.json(await membershipService.extendMembership(req.params.id, req.body.days)); } catch (err) { next(err); }
};
export const freezeMembership = async (req, res, next) => {
  try { res.json(await membershipService.freezeMembership(req.params.id)); } catch (err) { next(err); }
};
export const resumeMembership = async (req, res, next) => {
  try { res.json(await membershipService.resumeMembership(req.params.id)); } catch (err) { next(err); }
};

import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const result = await authService.registerCustomer(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function adminLogin(req, res, next) {
  try {
    const result = await authService.adminLogin(req.body);
    res.json(result);
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user);
    res.json(profile);
  } catch (err) { next(err); }
}

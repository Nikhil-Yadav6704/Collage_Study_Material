import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { supabase } from '../config/supabase';

export const requireOwnDept = (deptParamName = 'department_id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin') return next(); // Admins bypass dept check

    const requestedDeptId =
      req.params[deptParamName] ||
      req.body[deptParamName] ||
      req.query[deptParamName];

    if (!requestedDeptId) return next(); // No dept specified

    const { data: assignment } = await supabase
      .from('moderator_assignments')
      .select('department_id')
      .eq('user_id', req.user!.id)
      .eq('department_id', requestedDeptId)
      .single();

    if (!assignment) {
      return res.status(403).json({ error: 'Access denied to this department' });
    }
    next();
  };
};

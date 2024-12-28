import express from 'express';
import { editProfile, followOrUnfollow, getProfile, getSuggestedUsers, login, logout, register } from '../controllers/userController.js';
import isAuthenticated from '../middleware/isAuthenticated.js';
import upload from '../utils/multer.js';
const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated, getProfile);
router.route('/profile/edit').put(isAuthenticated, upload.single('profilePic'), editProfile);
router.route('/suggested').get(isAuthenticated, getSuggestedUsers);
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);


export default router;
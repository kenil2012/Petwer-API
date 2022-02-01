const controller = require('../controller/auth');
const { checkUserExisting, verifyToken, verifyOauthUser } = require('../middlewares/auth');
module.exports = (app) => {
    app.use(function(req, res, next) {
        res.header(
          "Access-Control-Allow-Headers",
          "x-access-token, Origin, Content-Type, Accept"
        );
        next();
      });
    app.post('/api/auth/register',[checkUserExisting],controller.signup);
    app.post('/api/auth/login',controller.signin);
    app.post('/api/auth/verify-email',controller.verifyEmail);
    app.post('/api/auth/forgot-password',controller.forgotPassword);
    app.post('/api/auth/reset-password',controller.resetPassword);
    app.post('/api/auth/change-password',[verifyToken],controller.changePassword);
    app.post('/api/auth/oauth-login',[verifyOauthUser],controller.registerOAuthUser);
}
const fs = require('fs');
const path = require('path');

describe('前端页面安全测试', () => {
    test('admin.html 不应包含硬编码密码', () => {
        const adminHtmlPath = path.join(__dirname, '..', 'admin.html');
        const adminHtmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
        
        // 验证管理员密码不再硬编码在前端
        expect(adminHtmlContent).not.toContain('admin123');
        expect(adminHtmlContent).not.toContain('ADMIN_PASSWORD');
    });

    test('admin_login.html 应该存在且包含登录表单', () => {
        const loginHtmlPath = path.join(__dirname, '..', 'admin_login.html');
        const loginHtmlContent = fs.readFileSync(loginHtmlPath, 'utf8');
        
        expect(loginHtmlContent).toContain('管理员登录');
        expect(loginHtmlContent).toContain('password');
        expect(loginHtmlContent).toContain('/api/login');
    });

    test('admin.html 应该包含会话验证逻辑', () => {
        const adminHtmlPath = path.join(__dirname, '..', 'admin.html');
        const adminHtmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
        
        expect(adminHtmlContent).toContain('sessionStorage.getItem');
        expect(adminHtmlContent).toContain('adminToken');
        expect(adminHtmlContent).toContain('window.location.href');
        expect(adminHtmlContent).toContain('admin_login.html');
    });
});
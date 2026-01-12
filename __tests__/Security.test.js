const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const app = require('../server'); // 假设你的服务器代码导出了app实例

describe('考试系统API安全测试', () => {
    let agent;
    let validToken;
    const JWT_SECRET = 'exam_system_secret_key';
    const ADMIN_PASSWORD = 'admin123';

    beforeAll(async () => {
        // 创建有效的JWT令牌
        validToken = jwt.sign(
            { 
                username: 'admin', 
                role: 'admin',
                exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12小时后过期
            }, 
            JWT_SECRET
        );
    });

    describe('登录认证测试', () => {
        test('应该成功登录并返回令牌', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ password: ADMIN_PASSWORD })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(typeof response.body.token).toBe('string');
        });

        test('应该拒绝空密码登录', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ password: '' })
                .expect(400);

            expect(response.body.error).toBe('密码不能为空');
        });

        test('应该拒绝错误密码登录', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({ password: 'wrongpassword' })
                .expect(401);

            expect(response.body.error).toBe('密码错误');
        });
    });

    describe('受保护API访问测试', () => {
        test('应该拒绝未授权访问成绩API', async () => {
            await request(app)
                .get('/api/scores')
                .expect(401)
                .expect('Content-Type', /json/);
        });

        test('应该拒绝未授权访问统计API', async () => {
            await request(app)
                .get('/api/stats')
                .expect(401)
                .expect('Content-Type', /json/);
        });

        test('应该拒绝未授权访问删除成绩API', async () => {
            await request(app)
                .delete('/api/scores/test123')
                .expect(401)
                .expect('Content-Type', /json/);
        });

        test('应该拒绝未授权清空所有成绩', async () => {
            await request(app)
                .delete('/api/scores')
                .expect(401)
                .expect('Content-Type', /json/);
        });

        test('应该接受有效令牌访问成绩API', async () => {
            await request(app)
                .get('/api/scores')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200)
                .expect('Content-Type', /json/);
        });

        test('应该接受有效令牌访问统计API', async () => {
            await request(app)
                .get('/api/stats')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200)
                .expect('Content-Type', /json/);
        });

        test('应该拒绝无效令牌访问受保护API', async () => {
            await request(app)
                .get('/api/scores')
                .set('Authorization', 'Bearer invalidtoken')
                .expect(403)
                .expect('Content-Type', /json/);
        });

        test('应该拒绝格式错误的令牌访问受保护API', async () => {
            await request(app)
                .get('/api/scores')
                .set('Authorization', 'invalidformat')
                .expect(401)
                .expect('Content-Type', /json/);
        });
    });

    describe('学生提交API测试（不受保护）', () => {
        test('应该允许学生提交成绩', async () => {
            const examData = {
                name: '测试学生',
                className: '初一1班',
                studentNumber: 'test001',
                score: 85,
                correctCount: 17,
                wrongCount: 3,
                timeUsed: 1200
            };

            const response = await request(app)
                .post('/api/submit')
                .send(examData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('成绩提交成功');
        });

        test('应该拒绝无效的学生数据', async () => {
            const invalidData = {
                name: '', // 空姓名
                className: '初一1班',
                studentNumber: 'test002',
                score: 85,
                correctCount: 17,
                wrongCount: 3,
                timeUsed: 1200
            };

            await request(app)
                .post('/api/submit')
                .send(invalidData)
                .expect(400);
        });
    });

    describe('JWT令牌生命周期测试', () => {
        test('应该验证令牌过期', async () => {
            // 创建一个已过期的令牌
            const expiredToken = jwt.sign(
                { 
                    username: 'admin', 
                    role: 'admin',
                    exp: Math.floor(Date.now() / 1000) - 1 // 已过期
                }, 
                JWT_SECRET
            );

            await request(app)
                .get('/api/scores')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(403);
        });
    });
});